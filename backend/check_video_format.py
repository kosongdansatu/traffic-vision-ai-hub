import os
import sqlite3
import json
import logging
import glob

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Get the base URL from environment or use default
API_URL = os.environ.get("API_URL", "http://localhost:8000")


def fix_video_urls_in_db():
    """Update the database to ensure all video URLs are properly formatted"""
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()

    # Get all videos
    cursor.execute("SELECT id, file_path, result_path, json_result_path FROM videos")
    videos = cursor.fetchall()

    logger.info(f"Found {len(videos)} videos in database")
    updated_count = 0

    for video in videos:
        video_id, file_path, result_path, json_result_path = video
        updated = False

        # Check if file_path exists and make it relative if it's absolute
        if file_path and os.path.exists(file_path):
            if os.path.isabs(file_path):
                new_file_path = os.path.relpath(file_path, os.getcwd())
                cursor.execute(
                    "UPDATE videos SET file_path = ? WHERE id = ?",
                    (new_file_path, video_id),
                )
                logger.info(f"Updated file_path for video {video_id}: {new_file_path}")
                updated = True
        else:
            logger.warning(f"File path doesn't exist for video {video_id}: {file_path}")

        # Check if result_path exists and make it relative if it's absolute
        if result_path and os.path.exists(result_path):
            if os.path.isabs(result_path):
                new_result_path = os.path.relpath(result_path, os.getcwd())
                cursor.execute(
                    "UPDATE videos SET result_path = ? WHERE id = ?",
                    (new_result_path, video_id),
                )
                logger.info(
                    f"Updated result_path for video {video_id}: {new_result_path}"
                )
                updated = True
        else:
            logger.warning(
                f"Result path doesn't exist for video {video_id}: {result_path}"
            )

        # Check if json_result_path exists and make it relative if it's absolute
        if json_result_path and os.path.exists(json_result_path):
            if os.path.isabs(json_result_path):
                new_json_path = os.path.relpath(json_result_path, os.getcwd())
                cursor.execute(
                    "UPDATE videos SET json_result_path = ? WHERE id = ?",
                    (new_json_path, video_id),
                )
                logger.info(
                    f"Updated json_result_path for video {video_id}: {new_json_path}"
                )
                updated = True
        else:
            logger.warning(
                f"JSON result path doesn't exist for video {video_id}: {json_result_path}"
            )

        if updated:
            updated_count += 1

    conn.commit()
    conn.close()

    logger.info(f"Updated {updated_count} videos in database")
    return updated_count


def check_video_files():
    """Check all video files in the results directory"""
    video_files = glob.glob("results/*_processed.mp4")
    logger.info(f"Found {len(video_files)} processed videos in results directory")

    for video_file in video_files:
        file_size = os.path.getsize(video_file)
        logger.info(f"Video file: {video_file}, Size: {file_size/1024/1024:.2f} MB")

        # Check if there's a corresponding JSON file
        json_file = video_file.replace("_processed.mp4", "_results.json")
        if os.path.exists(json_file):
            try:
                with open(json_file, "r") as f:
                    data = json.load(f)

                # Check if JSON has required fields
                has_tracked_objects = False
                if data.get("frames") and len(data["frames"]) > 0:
                    if "tracked_objects" in data["frames"][0]:
                        has_tracked_objects = True

                logger.info(
                    f"JSON file: {json_file}, Has tracked_objects: {has_tracked_objects}"
                )

                # Check if there's a corresponding thumbnail
                thumbnail_file = video_file.replace("_processed.mp4", "_thumbnail.jpg")
                if os.path.exists(thumbnail_file):
                    logger.info(f"Thumbnail exists: {thumbnail_file}")
                else:
                    logger.warning(f"Missing thumbnail for video: {video_file}")
            except Exception as e:
                logger.error(f"Error reading JSON file {json_file}: {str(e)}")
        else:
            logger.warning(f"Missing JSON file for video: {video_file}")


def main():
    """Main function"""
    logger.info("Starting video format check")

    # Fix video URLs in database
    fix_video_urls_in_db()

    # Check video files
    check_video_files()

    logger.info("Video format check complete")


if __name__ == "__main__":
    main()
