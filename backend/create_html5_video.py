import cv2
import numpy as np
import os
import logging
import glob
import tempfile
import shutil

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def convert_to_web_compatible(input_path, output_path=None):
    """Convert video to web-compatible format using OpenCV"""
    if output_path is None:
        output_path = input_path.replace(".mp4", "_web.mp4")

    logger.info(f"Converting {input_path} to web-compatible format")

    try:
        # Read the input video
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            logger.error(f"Could not open video file: {input_path}")
            return None

        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        logger.info(
            f"Video properties: {width}x{height}, {fps} fps, {total_frames} frames"
        )

        # Create a video writer with MP4V codec (more web compatible)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        # Process each frame
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Write frame to output video
            out.write(frame)
            frame_count += 1

            # Log progress
            if frame_count % 30 == 0:
                logger.info(
                    f"Processed {frame_count} of {total_frames} frames ({frame_count/total_frames*100:.1f}%)"
                )

        # Release resources
        cap.release()
        out.release()

        logger.info(f"Conversion complete: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Error converting video: {str(e)}")
        return None


def process_all_videos():
    """Process all MP4 videos in the results directory"""
    video_files = glob.glob("results/*_processed.mp4")
    logger.info(f"Found {len(video_files)} videos to process")

    success_count = 0
    error_count = 0

    for video_path in video_files:
        # Skip already processed videos
        if "_web.mp4" in video_path:
            continue

        # Create a temporary output path
        output_path = video_path.replace(".mp4", "_web.mp4")

        try:
            result = convert_to_web_compatible(video_path, output_path)
            if result:
                # Make a backup of the original
                if not os.path.exists(f"{video_path}.backup"):
                    shutil.copy2(video_path, f"{video_path}.backup")

                # Replace the original with the web-compatible version
                file_size_orig = os.path.getsize(video_path) / 1024
                file_size_new = os.path.getsize(output_path) / 1024

                logger.info(
                    f"Original size: {file_size_orig:.1f} KB, New size: {file_size_new:.1f} KB"
                )

                # Replace the original file
                shutil.move(output_path, video_path)
                logger.info(
                    f"Replaced original with web-compatible version: {video_path}"
                )
                success_count += 1
            else:
                logger.error(f"Failed to convert video: {video_path}")
                error_count += 1

        except Exception as e:
            logger.error(f"Error processing video {video_path}: {str(e)}")
            error_count += 1

    logger.info(f"Processing complete: {success_count} succeeded, {error_count} failed")


if __name__ == "__main__":
    process_all_videos()
