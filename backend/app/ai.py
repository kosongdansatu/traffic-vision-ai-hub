
from ultralytics import YOLO
import cv2
import numpy as np
import os
import json
from typing import Dict, List, Tuple, Any

# Load YOLOv8 model (pre-trained on COCO dataset)
# We'll use the model which already has vehicle classes
model = None

def get_model():
    global model
    if model is None:
        model = YOLO('yolov8n.pt')  # Load small YOLOv8 model
    return model

# Vehicle class mapping from COCO dataset
VEHICLE_CLASSES = {
    2: 'car',        # car
    3: 'motorcycle', # motorcycle
    5: 'bus',        # bus
    7: 'truck'       # truck
}

def process_frame(frame: np.ndarray, results: Dict) -> Tuple[np.ndarray, Dict]:
    """Process a single frame and detect vehicles"""
    model = get_model()
    
    # Run YOLOv8 inference on the frame
    detections = model(frame)
    
    # Get the first detection result
    detection = detections[0]
    
    # Initialize counts for this frame
    frame_counts = {
        'car': 0,
        'motorcycle': 0,
        'bus': 0,
        'truck': 0
    }
    
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
                
                # Increment count for this vehicle type
                frame_counts[vehicle_type] += 1
                
                # Calculate color based on vehicle type
                color_map = {
                    'car': (0, 255, 0),      # Green
                    'motorcycle': (0, 255, 255),  # Yellow
                    'bus': (255, 0, 0),      # Blue
                    'truck': (255, 0, 255)   # Purple
                }
                color = color_map.get(vehicle_type, (255, 255, 255))
                
                # Draw bounding box
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                
                # Add label with confidence
                label = f"{vehicle_type}: {confidence:.2f}"
                cv2.putText(annotated_frame, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Update result counts
    for vehicle_type, count in frame_counts.items():
        if 'total_counts' not in results:
            results['total_counts'] = {}
        if vehicle_type not in results['total_counts']:
            results['total_counts'][vehicle_type] = 0
        results['total_counts'][vehicle_type] += count
    
    # Add frame data
    if 'frames' not in results:
        results['frames'] = []
    
    results['frames'].append({
        'frame_number': len(results['frames']),
        'counts': frame_counts
    })
    
    return annotated_frame, results

def process_video(video_path: str, file_id: str) -> Tuple[str, str]:
    """
    Process a video file with YOLOv8 for vehicle detection
    
    Args:
        video_path: Path to the input video file
        file_id: Unique ID for the video
    
    Returns:
        Tuple containing:
        - Path to the processed video file with bounding boxes
        - Path to the JSON file with detection results
    """
    # Create results directory if it doesn't exist
    os.makedirs("results", exist_ok=True)
    
    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    
    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Initialize video writer for output
    result_path = f"results/{file_id}_processed.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(result_path, fourcc, fps, (width, height))
    
    # Initialize results dictionary
    results = {
        'video_id': file_id,
        'total_frames': total_frames,
        'fps': fps,
        'resolution': f"{width}x{height}",
        'total_counts': {},
        'frames': []
    }
    
    # Process each frame in the video
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Only process every 3rd frame to speed up processing
        if frame_count % 3 == 0:
            annotated_frame, results = process_frame(frame, results)
            out.write(annotated_frame)
        else:
            # Just write the original frame
            out.write(frame)
        
        frame_count += 1
        
        # Add progress indicator to console
        if frame_count % 30 == 0:
            percent = (frame_count / total_frames) * 100
            print(f"Processing video: {percent:.1f}% complete")
    
    # Calculate overall statistics
    results['processing_stats'] = {
        'processed_frames': len(results['frames']),
        'vehicle_density': sum(results['total_counts'].values()) / len(results['frames']) if results['frames'] else 0
    }
    
    # Save JSON results
    json_path = f"results/{file_id}_results.json"
    with open(json_path, 'w') as f:
        json.dump(results, f, indent=4)
    
    # Release resources
    cap.release()
    out.release()
    
    return result_path, json_path
