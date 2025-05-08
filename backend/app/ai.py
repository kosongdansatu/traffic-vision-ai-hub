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

# Track lifespan dalam frame, berapa lama objek yang tidak terlihat akan tetap dalam pelacakan
track_lifespan = 30

# Minimum IoU (Intersection over Union) untuk mencocokkan objek yang sama
MIN_IOU_THRESHOLD = 0.5  # Increased from 0.25 for better matching

# Dictionary untuk objek yang sedang di-track
tracked_vehicles = {}
next_track_id = 1

# Track unique vehicles that cross the counting line to prevent multiple counts
unique_counted_vehicles = set()

# Track object fingerprints to prevent duplicate counting of the same physical vehicle
object_fingerprints = set()

# Track repeated detections of the same object to clean up tracking
duplicate_detection_threshold = 0.5  # High IoU threshold for identifying duplicates

# Maximum counting frequency (in frames) to avoid multiple counts of the same vehicle
min_frames_between_counts = 10


# Create object fingerprint based on attributes
def create_object_fingerprint(bbox, vehicle_type, position_in_frame):
    """
    Create a unique fingerprint for a vehicle based on its properties
    Args:
        bbox: (x1, y1, x2, y2) bounding box
        vehicle_type: type of vehicle (car, truck, etc.)
        position_in_frame: relative position in frame (0-1 range)
    Returns:
        A string representing the object fingerprint
    """
    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1
    aspect_ratio = width / height if height > 0 else 0
    size = width * height

    # Create a fingerprint string combining vehicle properties
    # Round values to reduce sensitivity to small changes
    fingerprint = f"{vehicle_type}_{round(aspect_ratio, 1)}_{round(size/1000, 1)}_{round(position_in_frame, 1)}"

    return fingerprint


# Function to calculate IoU between two bounding boxes
def calculate_iou(box1, box2):
    """Calculate Intersection over Union (IoU) between two bounding boxes"""
    # Format box: (x1, y1, x2, y2)
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2

    # Calculate intersection area
    x_left = max(x1_1, x1_2)
    y_top = max(y1_1, y1_2)
    x_right = min(x2_1, x2_2)
    y_bottom = min(y2_1, y2_2)

    if x_right < x_left or y_bottom < y_top:
        return 0.0  # No intersection

    intersection_area = (x_right - x_left) * (y_bottom - y_top)

    # Calculate area of each box
    box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
    box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)

    # Calculate IoU
    iou = intersection_area / float(box1_area + box2_area - intersection_area)
    return iou


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

        try:
            # Try using torch hub
            model = YOLO(model_path)
            model.model_file = model_file  # Store which model file was used
            model.to(device)  # Move model to appropriate device
            logger.info(f"Model loaded in {time.time() - start_time:.2f} seconds")
        except Exception as e:
            logger.error(f"Error loading model with YOLO: {str(e)}")

            # If YOLO fails, we'll create a backup simple implementation for common detection classes
            class SimpleFallbackModel:
                def __init__(self):
                    self.model_file = model_file
                    self.device = device

                def __call__(self, frame, verbose=False):
                    # Return a simple structure with empty detection
                    class SimpleDetection:
                        def __init__(self):
                            class SimpleBoxes:
                                def __init__(self):
                                    self.boxes = []

                            self.boxes = SimpleBoxes()

                    return [SimpleDetection()]

                def to(self, device):
                    self.device = device
                    return self

            logger.warning("Using simple fallback model")
            model = SimpleFallbackModel()

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
    global tracked_vehicles, next_track_id, unique_counted_vehicles, object_fingerprints

    model = get_model(model_size)

    # Run YOLOv8 inference on the frame
    detections = model(frame, verbose=False)  # Matikan output verbose

    # Get the first detection result
    detection = detections[0]

    # Define counting line at the bottom part of the frame (80% of height)
    frame_height, frame_width = frame.shape[:2]
    counting_line_y = int(frame_height * 0.6)

    # Draw the counting line
    cv2.line(
        frame, (0, counting_line_y), (frame_width, counting_line_y), (255, 0, 0), 2
    )
    cv2.putText(
        frame,
        "Counting Line",
        (10, counting_line_y - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 0, 0),
        2,
    )

    # Initialize counts for this frame
    frame_counts = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}
    detected_objects = []
    current_tracked_ids = set()

    # Store all detections for this frame to process duplicates
    current_detections = []

    # Parse results and draw bounding boxes
    annotated_frame = frame.copy()

    if detection.boxes is not None:
        for box in detection.boxes:
            # Get class and confidence
            class_id = int(box.cls.item())
            confidence = box.conf.item()

            # Only process if it's a vehicle and confidence is high enough
            if class_id in VEHICLE_CLASSES and confidence > 0.4:  # Increased from 0.3
                vehicle_type = VEHICLE_CLASSES[class_id]

                # Get coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Minimum size check to avoid false positives
                bbox_width = x2 - x1
                bbox_height = y2 - y1
                min_size = (
                    min(frame_width, frame_height) * 0.03  # Increased from 0.02
                )  # 3% of frame dimension

                if bbox_width < min_size or bbox_height < min_size:
                    continue  # Skip too small objects, likely false detections

                # Store current detection for duplicate processing
                current_detection = {
                    "bbox": (x1, y1, x2, y2),
                    "type": vehicle_type,
                    "confidence": confidence,
                    "width": bbox_width,
                    "height": bbox_height,
                    "position_x": (x1 + x2) / 2 / frame_width,  # Normalized x position
                    "position_y": (y1 + y2) / 2 / frame_height,  # Normalized y position
                }
                current_detections.append(current_detection)

        # First pass: identify and remove duplicate detections in the current frame
        # Sort detections by confidence to keep the best ones
        current_detections.sort(key=lambda x: x["confidence"], reverse=True)
        filtered_detections = []
        for i, detection1 in enumerate(current_detections):
            keep = True
            # Check if this detection is a duplicate of any higher-confidence detection we're keeping
            for detection2 in filtered_detections:
                iou = calculate_iou(detection1["bbox"], detection2["bbox"])
                if (
                    iou > duplicate_detection_threshold
                    and detection1["type"] == detection2["type"]
                ):
                    keep = False
                    break
            if keep:
                filtered_detections.append(detection1)

        # Second pass: process the filtered detections
        for detection_info in filtered_detections:
            # Extract detection info
            x1, y1, x2, y2 = detection_info["bbox"]
            vehicle_type = detection_info["type"]
            confidence = detection_info["confidence"]
            bbox_width = detection_info["width"]
            bbox_height = detection_info["height"]
            position_x = detection_info["position_x"]
            position_y = detection_info["position_y"]

            # Create object fingerprint
            position_in_frame = position_y  # Use vertical position as a key component
            obj_fingerprint = create_object_fingerprint(
                (x1, y1, x2, y2), vehicle_type, position_in_frame
            )

            # Hitung centroid (titik tengah) objek
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            # Coba cocokkan dengan objek tertrack yang sudah ada berdasarkan posisi dan IoU
            matched_id = None
            max_iou = MIN_IOU_THRESHOLD
            min_distance = (
                min(frame_width, frame_height) * 0.15
            )  # Increased distance threshold

            for track_id, vehicle_info in tracked_vehicles.items():
                if vehicle_info["type"] == vehicle_type and vehicle_info["active"]:
                    # Calculate IoU between current box and tracked box
                    if "bbox" in vehicle_info:
                        tracked_bbox = vehicle_info["bbox"]
                        iou = calculate_iou((x1, y1, x2, y2), tracked_bbox)

                        # If IoU is good enough, prioritize IoU matching
                        if iou > max_iou:
                            max_iou = iou
                            matched_id = track_id
                            continue

                    # If IoU is not good enough, try distance-based matching
                    track_x, track_y = vehicle_info["centroid"]
                    distance = (
                        (center_x - track_x) ** 2 + (center_y - track_y) ** 2
                    ) ** 0.5

                    # Adaptive threshold based on object size
                    size_factor = (
                        (bbox_width + bbox_height) / 2 / 100
                    )  # Normalize by 100px
                    adaptive_threshold = min_distance * (1 + size_factor)

                    if distance < adaptive_threshold and matched_id is None:
                        matched_id = track_id

            # Jika cocok dengan objek yang ada, update informasinya
            if matched_id is not None:
                track_id = matched_id
                previous_y = tracked_vehicles[track_id]["centroid"][1]

                # Check if vehicle crossed the counting line from top to bottom
                crossed_line = (
                    previous_y < counting_line_y and center_y >= counting_line_y
                )

                # Update tracking info
                tracked_vehicles[track_id].update(
                    {
                        "centroid": (center_x, center_y),
                        "last_seen": frame_number,
                        "active": True,
                        "bbox": (x1, y1, x2, y2),
                        "confidence": confidence,
                        "fingerprint": obj_fingerprint,
                    }
                )

                # Create a unique vehicle signature to prevent multiple counting
                vehicle_signature = f"{track_id}_{vehicle_type}"

                # Check if enough frames have passed since this fingerprint was last counted
                last_counted_frame = tracked_vehicles[track_id].get(
                    "last_counted_frame", -min_frames_between_counts
                )
                enough_frames_passed = (
                    frame_number - last_counted_frame
                ) >= min_frames_between_counts

                # Increment count only if vehicle crossed the line and hasn't been counted already
                if (
                    crossed_line
                    and not tracked_vehicles[track_id].get("counted", False)
                    and vehicle_signature not in unique_counted_vehicles
                    and obj_fingerprint not in object_fingerprints
                    and enough_frames_passed
                ):
                    # Check if centroid is in the middle 80% of the frame width to avoid edge cases
                    if 0.1 * frame_width < center_x < 0.9 * frame_width:
                        # Mark as counted to avoid counting the same vehicle multiple times
                        tracked_vehicles[track_id]["counted"] = True
                        tracked_vehicles[track_id]["last_counted_frame"] = frame_number
                        unique_counted_vehicles.add(vehicle_signature)
                        object_fingerprints.add(obj_fingerprint)
                        frame_counts[vehicle_type] += 1

                        # Add visual indicator for counting
                        cv2.circle(
                            annotated_frame,
                            (center_x, center_y),
                            10,
                            (0, 0, 255),
                            -1,
                        )
                        cv2.putText(
                            annotated_frame,
                            f"Counted {vehicle_type}",
                            (center_x - 40, center_y - 15),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0, 0, 255),
                            2,
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
                    "counted": False,  # Initialize as not counted
                    "fingerprint": obj_fingerprint,
                }

                # Check if the vehicle starts below the counting line
                # If so, mark it as already counted to avoid false counts
                if center_y >= counting_line_y:
                    tracked_vehicles[track_id]["counted"] = True
                    tracked_vehicles[track_id]["last_counted_frame"] = frame_number
                    # Add to unique counted vehicles set to prevent future double-counting
                    unique_counted_vehicles.add(f"{track_id}_{vehicle_type}")
                    object_fingerprints.add(obj_fingerprint)

            current_tracked_ids.add(track_id)

            # Tambahkan ke daftar objek terdeteksi untuk frame ini
            detected_objects.append(
                {
                    "id": str(track_id),
                    "type": vehicle_type,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": float(confidence),
                    "centroid": [center_x, center_y],
                    "counted": tracked_vehicles[track_id].get("counted", False),
                    "fingerprint": obj_fingerprint,
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
            label = f"{vehicle_type} #{track_id}" + (
                " (Counted)" if tracked_vehicles[track_id].get("counted", False) else ""
            )
            cv2.putText(
                annotated_frame,
                label,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
            )

            # Draw centroid
            cv2.circle(annotated_frame, (center_x, center_y), 3, color, -1)

    # Draw the counting line again on top of the annotations
    cv2.line(
        annotated_frame,
        (0, counting_line_y),
        (frame_width, counting_line_y),
        (255, 0, 0),
        2,
    )
    cv2.putText(
        annotated_frame,
        "Counting Line",
        (10, counting_line_y - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 0, 0),
        2,
    )

    # Draw current counts for this frame
    for i, (vehicle_type, count) in enumerate(frame_counts.items()):
        if count > 0:
            cv2.putText(
                annotated_frame,
                f"New {vehicle_type}s: {count}",
                (10, 30 + i * 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color_map.get(vehicle_type, (255, 255, 255)),
                2,
            )

    # Get the cumulative counts so far
    if "total_counts" not in results:
        results["total_counts"] = {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0}

    # Ensure all vehicle types exist in the total_counts dictionary
    for vehicle_type in ["car", "motorcycle", "bus", "truck"]:
        if vehicle_type not in results["total_counts"]:
            results["total_counts"][vehicle_type] = 0

    # Update counts safely
    for vehicle_type, count in frame_counts.items():
        if vehicle_type in results["total_counts"]:
            results["total_counts"][vehicle_type] += count

    # Draw total counts in the top-right corner with background
    total_cars = results["total_counts"]["car"]
    total_motorcycles = results["total_counts"]["motorcycle"]
    total_buses = results["total_counts"]["bus"]
    total_trucks = results["total_counts"]["truck"]

    # Calculate how many rows we'll need to display
    num_rows = 3  # Title + Total + blank space
    if total_cars > 0:
        num_rows += 1
    if total_motorcycles > 0:
        num_rows += 1
    if total_buses > 0:
        num_rows += 1
    if total_trucks > 0:
        num_rows += 1

    # Create a semi-transparent background for the count display
    overlay = annotated_frame.copy()
    # Draw a black semi-transparent background rectangle
    box_height = 30 + (num_rows * 30)
    cv2.rectangle(
        overlay, (frame_width - 250, 10), (frame_width - 10, box_height), (0, 0, 0), -1
    )
    # Apply the overlay with transparency
    alpha = 0.6
    cv2.addWeighted(overlay, alpha, annotated_frame, 1 - alpha, 0, annotated_frame)

    # Draw title
    cv2.putText(
        annotated_frame,
        "TOTAL KENDARAAN:",
        (frame_width - 240, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
    )

    # Draw counts by vehicle type
    y_pos = 65  # Starting y position

    if total_cars > 0:
        cv2.putText(
            annotated_frame,
            f"Mobil: {total_cars}",
            (frame_width - 240, y_pos),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),  # Green for cars
            2,
        )
        y_pos += 30

    if total_motorcycles > 0:
        cv2.putText(
            annotated_frame,
            f"Motor: {total_motorcycles}",
            (frame_width - 240, y_pos),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),  # Yellow for motorcycles
            2,
        )
        y_pos += 30

    if total_buses > 0:
        cv2.putText(
            annotated_frame,
            f"Bus: {total_buses}",
            (frame_width - 240, y_pos),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 0),  # Blue for buses
            2,
        )
        y_pos += 30

    if total_trucks > 0:
        cv2.putText(
            annotated_frame,
            f"Truk: {total_trucks}",
            (frame_width - 240, y_pos),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 255),  # Purple for trucks
            2,
        )
        y_pos += 30

    # Draw total of all vehicles at the bottom
    total_all = total_cars + total_motorcycles + total_buses + total_trucks
    cv2.putText(
        annotated_frame,
        f"TOTAL: {total_all}",
        (frame_width - 240, y_pos),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),  # White for total
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
    Process a video, detect and track vehicles

    Args:
        video_path (str): Path to the input video
        file_id (str): Unique ID for the video
        model_size (str, optional): Size of the YOLOv8 model. Defaults to "nano".

    Returns:
        Tuple[str, str]: Paths to the processed video and JSON results
    """
    global tracked_vehicles, next_track_id, unique_counted_vehicles, object_fingerprints

    # Reset tracking for this video
    tracked_vehicles = {}
    next_track_id = 1
    unique_counted_vehicles = set()
    object_fingerprints = set()

    logger.info(f"Starting video processing with {model_size} model")
    start_time = time.time()

    # Path for saving thumbnail
    thumbnail_path = f"results/{file_id}_thumbnail.jpg"
    json_path = f"results/{file_id}_results.json"

    try:
        # Initialize video capture
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Failed to open video file: {video_path}")

        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        logger.info(
            f"Video details: {width}x{height}, {fps} fps, {total_frames} frames"
        )

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
            "counted_vehicles": {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0},
            "counting_line": {
                "description": "Objects counted when they cross this line from top to bottom",
                "y_position_percentage": 0.6,  # Updated to match the 60% used in process_frame
            },
            "debug_info": {
                "detection_parameters": {
                    "confidence_threshold": 0.4,  # Updated from 0.3
                    "min_size_percentage": 0.03,  # Updated from 0.02
                    "tracking_method": "IoU + Distance with Duplicate Filtering",
                    "iou_threshold": MIN_IOU_THRESHOLD,
                    "duplicate_detection_threshold": duplicate_detection_threshold,
                    "distance_threshold_factor": 0.15,
                    "track_lifespan": track_lifespan,
                    "unique_counting": "Multiple methods: track_id+type signature, object fingerprint, minimum frames between counts",
                    "min_frames_between_counts": min_frames_between_counts,
                }
            },
        }

        # Process each frame in the video
        frame_count = 0
        processed_count = 0
        thumbnail_captured = False

        # Determine frame sampling rate based on video length and model size
        # Process fewer frames for larger models or longer videos to improve speed
        sampling_rate = 1  # Default for nano model (Process every frame)

        # Adjust sampling rate based on video length and model size
        if total_frames > 500:
            sampling_rate = 2  # Process every other frame for longer videos
        if total_frames > 1000:
            sampling_rate = 3  # Process every third frame for very long videos

        # Increase sampling rate for larger models (they're slower)
        if model_size in ["medium", "large", "x-large"]:
            sampling_rate += 1

        logger.info(
            f"Using sampling rate: {sampling_rate} (processing 1/{sampling_rate} frames)"
        )

        # Dictionary to track stability metrics
        stability_metrics = {
            "detection_counts": [],
            "vehicle_types": [],
        }

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Reduce processing load by skipping frames according to sampling rate
            if frame_count % sampling_rate != 0 and frame_count > 1:
                continue

            # Skip frames at the beginning (often contain fade-in effects or uninteresting content)
            if (
                frame_count < fps * 1 and total_frames > fps * 10
            ):  # Skip first second if video is > 10 seconds
                continue

            # Capture thumbnail at 25% of the video
            if not thumbnail_captured and frame_count >= total_frames * 0.25:
                cv2.imwrite(thumbnail_path, frame)
                thumbnail_captured = True
                logger.info(f"Captured thumbnail at frame {frame_count}")

            try:
                # Process frame for vehicle detection
                processed_frame, updated_results = process_frame(
                    frame, results, model_size, processed_count
                )
                processed_count += 1

                # Collect stability metrics
                current_frame_data = updated_results["frames"][-1]
                stability_metrics["detection_counts"].append(
                    len(current_frame_data.get("tracked_objects", []))
                )
                vehicle_types_in_frame = {}
                for obj in current_frame_data.get("tracked_objects", []):
                    vtype = obj.get("type", "unknown")
                    vehicle_types_in_frame[vtype] = (
                        vehicle_types_in_frame.get(vtype, 0) + 1
                    )
                stability_metrics["vehicle_types"].append(vehicle_types_in_frame)

                # Add timestamp to show progress
                cv2.putText(
                    processed_frame,
                    f"Frame: {frame_count}/{total_frames}",
                    (width - 200, height - 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1,
                )

                # Write processed frame to output video
                out.write(processed_frame)

                # Update results with latest data
                results = updated_results

            except Exception as e:
                logger.error(f"Error processing frame {frame_count}: {str(e)}")
                traceback.print_exc()

                # Add empty frame data to maintain consistency
                if "frames" in results:
                    results["frames"].append(
                        {
                            "frame_number": len(results["frames"]),
                            "counts": {"car": 0, "motorcycle": 0, "bus": 0, "truck": 0},
                            "tracked_objects": [],
                            "error": str(e),
                        }
                    )

            # Log progress periodically
            if frame_count % (50 * sampling_rate) == 0:
                elapsed = time.time() - start_time
                progress = frame_count / total_frames * 100 if total_frames > 0 else 0
                logger.info(
                    f"Progress: {progress:.1f}% ({frame_count}/{total_frames}) - Time elapsed: {elapsed:.1f}s"
                )

        # Make sure we have a thumbnail even if we didn't get to 25%
        if not thumbnail_captured and frame_count > 0:
            # Reset to first frame to get a thumbnail
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if ret:
                cv2.imwrite(thumbnail_path, frame)

        # Log information about processed frames
        logger.info(
            f"Processed {processed_count} frames out of {frame_count} total frames"
        )

        # If we didn't process any frames successfully, raise an error
        if processed_count == 0:
            raise Exception("Failed to process any frames in the video")

        # Calculate detection stability metrics
        if stability_metrics["detection_counts"]:
            results["debug_info"]["stability"] = {
                "avg_detections_per_frame": sum(stability_metrics["detection_counts"])
                / len(stability_metrics["detection_counts"]),
                "max_detections": max(stability_metrics["detection_counts"]),
                "min_detections": min(stability_metrics["detection_counts"]),
                "detection_variance": (
                    np.var(stability_metrics["detection_counts"])
                    if len(stability_metrics["detection_counts"]) > 1
                    else 0
                ),
            }

        # Count unique vehicles tracked and those that were counted (crossed the line)
        for track_id, vehicle_info in tracked_vehicles.items():
            vehicle_type = vehicle_info["type"]
            results["unique_vehicles"][vehicle_type] += 1
            if vehicle_info.get("counted", False):
                results["counted_vehicles"][vehicle_type] += 1

        # Calculate overall statistics
        processing_time = time.time() - start_time
        total_counted = sum(results["counted_vehicles"].values())

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
            "total_vehicles_counted": total_counted,
            "counting_method": "Line crossing (bottom 60% of frame)",
        }

        # Update total_counts to reflect only the counted vehicles (line crossings)
        results["total_counts"] = results["counted_vehicles"]

        # Save results to JSON file
        with open(json_path, "w") as f:
            json.dump(results, f, indent=2)

        # Release resources
        cap.release()
        out.release()

        logger.info(
            f"Video processing completed in {processing_time:.2f} seconds. "
            f"Total vehicles detected: {sum(results['unique_vehicles'].values())}, "
            f"Vehicles counted: {total_counted}"
        )

        return result_path, json_path

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        traceback.print_exc()
        raise
