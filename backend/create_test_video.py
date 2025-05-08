import cv2
import numpy as np
import os
import logging
import uuid

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_test_video():
    """Create a simple test video that should be playable in all browsers"""
    # Create results directory if it doesn't exist
    os.makedirs("results", exist_ok=True)

    # Generate a unique ID for the test video
    file_id = f"test_{uuid.uuid4().hex[:8]}"
    output_path = f"results/{file_id}_processed.mp4"
    thumbnail_path = f"results/{file_id}_thumbnail.jpg"
    json_path = f"results/{file_id}_results.json"

    # Video parameters
    fps = 30
    width, height = 640, 480
    duration = 5  # seconds

    # Create a VideoWriter object
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")  # MP4 codec
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Create frames with simple animation
    logger.info(f"Creating test video at {output_path}")

    # Create a blank thumbnail
    thumbnail = np.zeros((height, width, 3), np.uint8)
    cv2.putText(
        thumbnail,
        "Test Video",
        (width // 4, height // 2),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (255, 255, 255),
        2,
    )
    cv2.imwrite(thumbnail_path, thumbnail)

    # Create an animated sequence
    for i in range(fps * duration):
        # Create a black frame
        frame = np.zeros((height, width, 3), np.uint8)

        # Add moving text
        t = i / fps  # time in seconds
        x_pos = int((width - 200) * (0.5 + 0.4 * np.sin(t)))
        y_pos = int(height * (0.5 + 0.3 * np.cos(t * 1.5)))

        # Draw a circle
        radius = int(50 + 20 * np.sin(t * 2))
        color = (
            int(127 + 127 * np.sin(t * 3)),
            int(127 + 127 * np.sin(t * 3 + 2)),
            int(127 + 127 * np.sin(t * 3 + 4)),
        )
        cv2.circle(frame, (x_pos, y_pos), radius, color, -1)

        # Add some text
        cv2.putText(
            frame,
            "Test Video",
            (width // 4, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            2,
        )
        cv2.putText(
            frame,
            f"Frame: {i}",
            (20, height - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
        )

        # Write frame to video
        out.write(frame)

        # Save first frame as thumbnail
        if i == 0:
            cv2.imwrite(thumbnail_path, frame)

    # Release the writer
    out.release()

    # Create a sample JSON file with tracked objects
    import json

    # Create sample tracked objects
    tracked_objects = []
    for i in range(5):
        obj = {
            "id": str(i + 1),
            "type": "car" if i % 2 == 0 else "motorcycle",
            "bbox": [100 + i * 50, 100 + i * 30, 200 + i * 50, 200 + i * 30],
            "confidence": 0.8 + i * 0.03,
            "centroid": [150 + i * 50, 150 + i * 30],
        }
        tracked_objects.append(obj)

    # Create sample frames data
    frames = []
    for i in range(fps * duration):
        frame_data = {
            "frame_number": i,
            "counts": {"car": 3, "motorcycle": 2, "bus": 0, "truck": 0},
            "tracked_objects": tracked_objects,
        }
        frames.append(frame_data)

    # Create full JSON structure
    json_data = {
        "video_id": file_id,
        "total_frames": fps * duration,
        "fps": fps,
        "resolution": f"{width}x{height}",
        "model_used": "test",
        "thumbnail_path": thumbnail_path,
        "total_counts": {"car": 3, "motorcycle": 2, "bus": 0, "truck": 0},
        "frames": frames,
        "unique_vehicles": {"car": 3, "motorcycle": 2, "bus": 0, "truck": 0},
        "processing_stats": {
            "processed_frames": fps * duration,
            "total_frames": fps * duration,
            "processing_time_seconds": 0.5,
            "frames_per_second": fps * 2,
            "vehicle_density": 0.042,
        },
    }

    # Write JSON to file
    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=2)

    logger.info(f"Created test video at {output_path}")
    logger.info(f"Created thumbnail at {thumbnail_path}")
    logger.info(f"Created JSON at {json_path}")

    # Print codec information
    file_size = os.path.getsize(output_path)
    logger.info(f"Video file size: {file_size/1024:.1f} KB")

    return output_path, thumbnail_path, json_path


if __name__ == "__main__":
    create_test_video()
