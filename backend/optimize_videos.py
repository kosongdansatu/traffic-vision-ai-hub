import os
import sqlite3
import subprocess
import shutil
import logging
import traceback
import glob

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Check if ffmpeg is installed
try:
    subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    logger.info("ffmpeg is installed and available")
except Exception as e:
    logger.error(
        "ffmpeg is not installed or not in PATH. Please install ffmpeg to continue."
    )
    logger.error(f"Error: {str(e)}")
    exit(1)


def optimize_video(video_path, output_path):
    """Re-encode a video for better web browser compatibility"""
    try:
        # Make a backup of the original
        if not os.path.exists(f"{video_path}.backup"):
            shutil.copy2(video_path, f"{video_path}.backup")
            logger.info(f"Created backup of original video: {video_path}.backup")

        # Re-encode the video with ffmpeg using h.264 codec and web-compatible settings
        command = [
            "ffmpeg",
            "-y",  # Overwrite output file if it exists
            "-i",
            video_path,  # Input file
            "-c:v",
            "libx264",  # Use H.264 codec for video
            "-preset",
            "medium",  # Balance between encoding speed and quality
            "-profile:v",
            "baseline",  # Use baseline profile for maximum compatibility
            "-level",
            "3.0",  # Compatible with older devices
            "-pix_fmt",
            "yuv420p",  # Pixel format supported by most browsers
            "-movflags",
            "+faststart",  # Move metadata to beginning of file for fast start
            "-c:a",
            "aac",  # Use AAC codec for audio
            "-b:a",
            "128k",  # Audio bitrate
            output_path,  # Output file
        ]

        logger.info(f"Re-encoding video: {video_path}")
        logger.info(f"Command: {' '.join(command)}")

        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode != 0:
            logger.error(f"Error re-encoding video: {result.stderr}")
            return False

        # Check if output file exists and has a reasonable size
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
            logger.error(f"Output file doesn't exist or is too small: {output_path}")
            return False

        logger.info(f"Successfully re-encoded video to: {output_path}")
        return True

    except Exception as e:
        logger.error(f"Error optimizing video {video_path}: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def main():
    """Main function to process all videos"""
    # Connect to the database
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()

    # Get all videos with result_path
    cursor.execute(
        "SELECT id, result_path FROM videos WHERE status = 'completed' AND result_path IS NOT NULL"
    )
    videos = cursor.fetchall()

    logger.info(f"Found {len(videos)} completed videos to optimize")
    success_count = 0
    error_count = 0

    # Process each video
    for video in videos:
        video_id, result_path = video

        if not os.path.exists(result_path):
            logger.warning(f"Video file does not exist: {result_path}")
            error_count += 1
            continue

        # Create a temporary output path
        temp_output_path = f"{result_path}.optimized.mp4"

        # Optimize the video
        if optimize_video(result_path, temp_output_path):
            # Replace the original with the optimized version
            try:
                os.remove(result_path)
                shutil.move(temp_output_path, result_path)
                logger.info(
                    f"Replaced original video with optimized version: {result_path}"
                )
                success_count += 1
            except Exception as e:
                logger.error(f"Error replacing original video: {str(e)}")
                error_count += 1
        else:
            # Optimization failed
            if os.path.exists(temp_output_path):
                os.remove(temp_output_path)
            logger.error(f"Failed to optimize video: {result_path}")
            error_count += 1

    # Optimize videos that might not be in the database (old or broken references)
    processed_videos = glob.glob("results/*_processed.mp4")
    for video_path in processed_videos:
        # Skip if already processed (database entries)
        is_db_video = False
        for _, result_path in videos:
            if result_path == video_path:
                is_db_video = True
                break

        if is_db_video:
            continue

        logger.info(f"Found video not in database: {video_path}")

        # Create a temporary output path
        temp_output_path = f"{video_path}.optimized.mp4"

        # Optimize the video
        if optimize_video(video_path, temp_output_path):
            # Replace the original with the optimized version
            try:
                os.remove(video_path)
                shutil.move(temp_output_path, video_path)
                logger.info(
                    f"Replaced original video with optimized version: {video_path}"
                )
                success_count += 1
            except Exception as e:
                logger.error(f"Error replacing original video: {str(e)}")
                error_count += 1
        else:
            # Optimization failed
            if os.path.exists(temp_output_path):
                os.remove(temp_output_path)
            logger.error(f"Failed to optimize video: {video_path}")
            error_count += 1

    logger.info(
        f"Video optimization completed: {success_count} succeeded, {error_count} failed"
    )

    # Close database connection
    conn.close()


if __name__ == "__main__":
    main()
