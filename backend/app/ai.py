from ultralytics import YOLO
import cv2
import numpy as np
import os
import json
import time
import torch
from typing import Dict, List, Tuple, Any
import logging
import traceback
import urllib.request
import shutil
import uuid
from collections import defaultdict

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create models directory if it doesn't exist
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

# Model options
MODEL_OPTIONS = {
    "nano": "yolov8n.pt",
    "small": "yolov8s.pt",
    "medium": "yolov8m.pt",
    "large": "yolov8l.pt",
    "x-large": "yolov8x.pt",
}

# Default model
DEFAULT_MODEL = "yolov8n.pt"
MODEL_PATH = os.path.join(MODELS_DIR, DEFAULT_MODEL)

# Load YOLOv8 model (pre-trained on COCO dataset)
model = None

# Tracker untuk kendaraan yang terdeteksi
tracked_vehicles = {}
next_track_id = 1
track_lifespan = 20  # Jumlah frame untuk mempertahankan track yang tidak terlihat


def download_model(model_name, save_path):
    """Download YOLOv8 model from the official repository"""
    try:
        logger.info(f"Downloading {model_name} to {save_path}")
        # Use the direct URL to the model
        url = f"https://github.com/ultralytics/assets/releases/download/v0.0.0/{model_name}"

        # Download with progress tracking
        with urllib.request.urlopen(url) as response, open(save_path, "wb") as out_file:
            file_size = int(response.info().get("Content-Length", -1))
            if file_size > 0:
                logger.info(f"Downloading file of size: {file_size/1024/1024:.2f} MB")

            # Download the file
            shutil.copyfileobj(response, out_file)

        logger.info(f"Download completed: {save_path}")
        return True
    except Exception as e:
        logger.error(f"Error downloading model: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def get_model(model_size="nano"):
    """Get or load YOLOv8 model with specified size"""
    global model

    try:
        # Check if CUDA is available
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")

        # Determine which model file to use
        model_file = MODEL_OPTIONS.get(model_size, DEFAULT_MODEL)
        model_path = os.path.join(MODELS_DIR, model_file)

        # If model is already loaded and it's the same size, return it
        if model is not None and getattr(model, "model_file", None) == model_file:
            logger.info(f"Using already loaded model: {model_file}")
            return model

        # Check if model file exists, download if not
        if not os.path.exists(model_path):
            logger.info(f"Model file not found: {model_path}")
            success = download_model(model_file, model_path)
            if not success:
                # Fallback to default model if download fails
                logger.warning(f"Falling back to default model: {DEFAULT_MODEL}")
                model_file = DEFAULT_MODEL
                model_path = os.path.join(MODELS_DIR, model_file)
                if not os.path.exists(model_path):
                    if not download_model(model_file, model_path):
                        raise Exception(f"Failed to download model: {model_file}")

        # Load the model
        logger.info(f"Loading YOLOv8 model from {model_path}")
        start_time = time.time()
        model = YOLO(model_path)
        model.model_file = model_file  # Store which model file was used
        model.to(device)  # Move model to appropriate device
        logger.info(f"Model loaded in {time.time() - start_time:.2f} seconds")

        return model
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        logger.error(traceback.format_exc())
        # Try loading default model as fallback
        try:
            if model_file != DEFAULT_MODEL:
                logger.info("Attempting to load default model as fallback")
                model_path = os.path.join(MODELS_DIR, DEFAULT_MODEL)
                if not os.path.exists(model_path):
                    download_model(DEFAULT_MODEL, model_path)
                model = YOLO(model_path)
                model.model_file = DEFAULT_MODEL
                return model
        except Exception as fallback_error:
            logger.error(f"Fallback also failed: {str(fallback_error)}")
        raise


# Vehicle class mapping from COCO dataset
VEHICLE_CLASSES = {
    2: "car",  # car
    3: "motorcycle",  # motorcycle
    5: "bus",  # bus
    7: "truck",  # truck
}


def process_frame(
    frame: np.ndarray, results: Dict, model_size="nano", frame_number=0
) -> Tuple[np.ndarray, Dict]:
    """Process a single frame and detect vehicles with tracking"""
    global tracked_vehicles, next_track_id

    model = get_model(model_size)

    # Run YOLOv8 inference on the frame
    detections = model(frame, verbose=False)  # Matikan output verbose

    # Get the first detection result
    detection = detections[0]

    # Initialize counts for this frame
    frame_counts = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}
    detected_objects = []
    current_tracked_ids = set()

    # Dictionary untuk objek yang terdeteksi di frame ini
    frame_detections = {}

    # Parse results and draw bounding boxes
    annotated_frame = frame.copy()

    if detection.boxes is not None:
        for box in detection.boxes:
            # Get class and confidence
            class_id = int(box.cls.item())
            confidence = box.conf.item()

            # Only process if it's a vehicle and confidence is high enough
            if class_id in VEHICLE_CLASSES and confidence > 0.25:
                vehicle_type = VEHICLE_CLASSES[class_id]

                # Get coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Hitung centroid (titik tengah) objek
                center_x = (x1 + x2) // 2
                center_y = (y1 + y2) // 2

                # Coba cocokkan dengan objek tertrack yang sudah ada berdasarkan posisi
                matched_id = None
                min_distance = float("inf")

                for track_id, vehicle_info in tracked_vehicles.items():
                    if vehicle_info["type"] == vehicle_type and vehicle_info["active"]:
                        # Hitung jarak Euclidean
                        track_x, track_y = vehicle_info["centroid"]
                        distance = (
                            (center_x - track_x) ** 2 + (center_y - track_y) ** 2
                        ) ** 0.5

                        # Jika jaraknya cukup dekat, ini mungkin objek yang sama
                        # Nilai threshold bisa disesuaikan tergantung pada ukuran frame dan kecepatan objek
                        if (
                            distance < min(frame.shape[0], frame.shape[1]) * 0.1
                            and distance < min_distance
                        ):
                            min_distance = distance
                            matched_id = track_id

                # Jika cocok dengan objek yang ada, update informasinya
                if matched_id is not None:
                    track_id = matched_id
                    tracked_vehicles[track_id].update(
                        {
                            "centroid": (center_x, center_y),
                            "last_seen": frame_number,
                            "active": True,
                            "bbox": (x1, y1, x2, y2),
                            "confidence": confidence,
                        }
                    )
                else:
                    # Buat ID tracking baru
                    track_id = next_track_id
                    next_track_id += 1
                    tracked_vehicles[track_id] = {
                        "type": vehicle_type,
                        "centroid": (center_x, center_y),
                        "first_seen": frame_number,
                        "last_seen": frame_number,
                        "active": True,
                        "bbox": (x1, y1, x2, y2),
                        "confidence": confidence,
                    }
                    # Increment count hanya untuk objek baru
                    frame_counts[vehicle_type] += 1

                current_tracked_ids.add(track_id)

                # Tambahkan ke daftar objek terdeteksi untuk frame ini
                detected_objects.append(
                    {
                        "id": str(track_id),
                        "type": vehicle_type,
                        "bbox": [x1, y1, x2, y2],
                        "confidence": float(confidence),
                        "centroid": [center_x, center_y],
                    }
                )

                # Calculate color based on vehicle type
                color_map = {
                    "car": (0, 255, 0),  # Green
                    "motorcycle": (0, 255, 255),  # Yellow
                    "bus": (255, 0, 0),  # Blue
                    "truck": (255, 0, 255),  # Purple
                }
                color = color_map.get(vehicle_type, (255, 255, 255))

                # Draw bounding box
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)

                # Add label with ID and confidence
                label = f"{vehicle_type} #{track_id}: {confidence:.2f}"
                cv2.putText(
                    annotated_frame,
                    label,
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    color,
                    2,
                )

    # Update status objek yang tidak terlihat di frame ini
    for track_id in list(tracked_vehicles.keys()):
        if track_id not in current_tracked_ids:
            # Jika objek sudah tidak terlihat terlalu lama, hapus dari tracking
            if (
                frame_number - tracked_vehicles[track_id]["last_seen"]
            ) > track_lifespan:
                tracked_vehicles[track_id]["active"] = False

    # Update total counts secara kumulatif
    if "total_counts" not in results:
        results["total_counts"] = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}

    for vehicle_type, count in frame_counts.items():
        results["total_counts"][vehicle_type] += count

    # Add frame data with tracking info
    if "frames" not in results:
        results["frames"] = []

    # Ensure tracked_objects is included in the frame data
    results["frames"].append(
        {
            "frame_number": len(results["frames"]),
            "counts": frame_counts,
            "tracked_objects": detected_objects,
        }
    )

    return annotated_frame, results


def process_video(video_path: str, file_id: str, model_size="nano") -> Tuple[str, str]:
    """
    Process a video file with YOLOv8 for vehicle detection with tracking

    Args:
        video_path: Path to the input video file
        file_id: Unique ID for the video
        model_size: Size of the YOLOv8 model to use (nano, small, medium, large, x-large)

    Returns:
        Tuple containing:
        - Path to the processed video file with bounding boxes
        - Path to the JSON file with detection results
    """
    # Reset tracking variables
    global tracked_vehicles, next_track_id
    tracked_vehicles = {}
    next_track_id = 1

    # Create results directory if it doesn't exist
    os.makedirs("results", exist_ok=True)

    # Save thumbnail for preview
    thumbnail_path = f"results/{file_id}_thumbnail.jpg"

    # Log processing start with model information
    logger.info(f"Processing video {file_id} with model size: {model_size}")
    start_time = time.time()

    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception(f"Failed to open video file: {video_path}")

    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    logger.info(f"Video details: {width}x{height}, {fps} fps, {total_frames} frames")

    # Initialize video writer for output
    result_path = f"results/{file_id}_processed.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(result_path, fourcc, fps, (width, height))

    # Initialize results dictionary
    results = {
        "video_id": file_id,
        "total_frames": total_frames,
        "fps": fps,
        "resolution": f"{width}x{height}",
        "model_used": model_size,
        "thumbnail_path": thumbnail_path,
        "total_counts": {},
        "frames": [],
        "unique_vehicles": {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0},
    }

    try:
        # Process each frame in the video
        frame_count = 0
        processed_count = 0
        thumbnail_captured = False

        # Determine frame sampling rate based on video length and model size
        # Process fewer frames for larger models or longer videos to improve speed
        sampling_rate = 2  # Default for nano model
        if model_size in ["small", "medium"]:
            sampling_rate = 3
        elif model_size in ["large", "x-large"]:
            sampling_rate = 4

        # If video is very long, increase sampling rate further
        if total_frames > 1000:
            sampling_rate += 1
        if total_frames > 3000:
            sampling_rate += 1

        logger.info(
            f"Using frame sampling rate: {sampling_rate} (processing every {sampling_rate}th frame)"
        )

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Capture thumbnail around 25% of the video
            if not thumbnail_captured and frame_count >= total_frames * 0.25:
                cv2.imwrite(thumbnail_path, frame)
                thumbnail_captured = True

            # Only process every Nth frame to speed up processing
            if frame_count % sampling_rate == 0:
                try:
                    annotated_frame, results = process_frame(
                        frame, results, model_size, frame_count
                    )
                    out.write(annotated_frame)
                    processed_count += 1
                except Exception as e:
                    logger.error(f"Error processing frame {frame_count}: {str(e)}")
                    # Just write the original frame
                    out.write(frame)
            else:
                # Just write the original frame
                out.write(frame)

            frame_count += 1

            # Add progress indicator to console
            if frame_count % 30 == 0:
                percent = (frame_count / total_frames) * 100
                elapsed = time.time() - start_time
                eta = (
                    (elapsed / frame_count) * (total_frames - frame_count)
                    if frame_count > 0
                    else 0
                )
                logger.info(
                    f"Processing video: {percent:.1f}% complete, ETA: {eta:.1f}s"
                )

        # Make sure we have a thumbnail even if we didn't get to 25%
        if not thumbnail_captured and frame_count > 0:
            # Reset to first frame to get a thumbnail
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if ret:
                cv2.imwrite(thumbnail_path, frame)

        # Count unique vehicles tracked
        for vehicle_info in tracked_vehicles.values():
            vehicle_type = vehicle_info["type"]
            results["unique_vehicles"][vehicle_type] += 1

        # Calculate overall statistics
        processing_time = time.time() - start_time
        results["processing_stats"] = {
            "processed_frames": processed_count,
            "total_frames": frame_count,
            "processing_time_seconds": processing_time,
            "frames_per_second": (
                processed_count / processing_time if processing_time > 0 else 0
            ),
            "vehicle_density": (
                sum(results["unique_vehicles"].values()) / processed_count
                if processed_count > 0
                else 0
            ),
        }

        logger.info(f"Video processing completed in {processing_time:.2f} seconds")
        logger.info(
            f"Detected {sum(results.get('unique_vehicles', {}).values())} unique vehicles in total"
        )

        # Save JSON results
        json_path = f"results/{file_id}_results.json"
        with open(json_path, "w") as f:
            json.dump(results, f, indent=4)

        # Release resources
        cap.release()
        out.release()

        return result_path, json_path

    except Exception as e:
        # Clean up resources on error
        logger.error(f"Error during video processing: {str(e)}")
        logger.error(traceback.format_exc())

        if cap.isOpened():
            cap.release()
        if out.isOpened():
            out.release()

        raise
