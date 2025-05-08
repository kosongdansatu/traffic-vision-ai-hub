import os
import sqlite3
import cv2
import logging
import traceback

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Database connection
conn = sqlite3.connect("app.db")
cursor = conn.cursor()

# Get all completed videos
cursor.execute(
    "SELECT id, file_path, result_path, json_result_path FROM videos WHERE status = 'completed'"
)
videos = cursor.fetchall()

logger.info(f"Found {len(videos)} completed videos to check")

fixed_count = 0
error_count = 0

for video in videos:
    video_id, file_path, result_path, json_result_path = video

    # Skip if any path is None
    if not result_path or not json_result_path:
        logger.warning(
            f"Video ID {video_id} has missing paths: result_path={result_path}, json_path={json_result_path}"
        )
        continue

    # Calculate expected thumbnail path
    if json_result_path and "_results.json" in json_result_path:
        thumbnail_path = json_result_path.replace("_results.json", "_thumbnail.jpg")
    else:
        file_id = os.path.splitext(os.path.basename(file_path))[0]
        thumbnail_path = f"results/{file_id}_thumbnail.jpg"

    logger.info(f"Checking thumbnail for video ID {video_id}: {thumbnail_path}")

    # Check if thumbnail exists
    if not os.path.exists(thumbnail_path) and os.path.exists(result_path):
        logger.info(f"Thumbnail missing for video ID {video_id}, creating from video")

        try:
            # Extract thumbnail from processed video
            cap = cv2.VideoCapture(result_path)

            if cap.isOpened():
                # Jump to 25% of the video to capture a good frame
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(total_frames * 0.25))
                ret, frame = cap.read()

                if ret:
                    # Create results directory if it doesn't exist
                    os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
                    cv2.imwrite(thumbnail_path, frame)
                    logger.info(f"Created thumbnail at {thumbnail_path}")
                    fixed_count += 1
                else:
                    logger.error(f"Failed to read frame from video {result_path}")
                    error_count += 1

            cap.release()
        except Exception as e:
            logger.error(f"Error creating thumbnail for video ID {video_id}: {str(e)}")
            logger.error(traceback.format_exc())
            error_count += 1

logger.info(
    f"Thumbnail check completed: Fixed {fixed_count} videos, {error_count} errors"
)

# Close database connection
conn.close()
