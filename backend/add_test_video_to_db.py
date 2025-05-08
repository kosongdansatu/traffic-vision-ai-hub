import os
import sqlite3
import glob
import logging
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def find_test_videos():
    """Find test videos in the results directory"""
    test_videos = []
    videos = glob.glob("results/test_*_processed.mp4")

    for video_path in videos:
        base_name = os.path.basename(video_path).replace("_processed.mp4", "")
        json_path = f"results/{base_name}_results.json"
        thumbnail_path = f"results/{base_name}_thumbnail.jpg"

        if os.path.exists(json_path) and os.path.exists(thumbnail_path):
            test_videos.append(
                {
                    "video_path": video_path,
                    "json_path": json_path,
                    "thumbnail_path": thumbnail_path,
                    "base_name": base_name,
                }
            )

    return test_videos


def add_to_database(test_videos):
    """Add test videos to the database"""
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()

    # Check if any test videos already exist in the database
    for video_info in test_videos:
        cursor.execute(
            "SELECT id FROM videos WHERE file_path LIKE ? OR result_path = ?",
            (f"%{video_info['base_name']}%", video_info["video_path"]),
        )
        existing = cursor.fetchone()

        if existing:
            logger.info(f"Test video already exists in database with ID {existing[0]}")
            continue

        # Get video metadata from JSON file
        with open(video_info["json_path"], "r") as f:
            metadata = json.load(f)

        # Add to database with user_id 1 (admin)
        cursor.execute(
            """
            INSERT INTO videos 
            (name, file_path, status, result_path, json_result_path, model_size, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """,
            (
                f"Test Video {video_info['base_name']}",
                video_info[
                    "video_path"
                ],  # Using the same path for original and processed
                "completed",
                video_info["video_path"],
                video_info["json_path"],
                metadata.get("model_used", "test"),
                1,  # Assuming user ID 1 exists (admin)
            ),
        )

        video_id = cursor.lastrowid
        logger.info(f"Added test video to database with ID {video_id}")

    conn.commit()
    conn.close()


def main():
    """Main function"""
    logger.info("Looking for test videos...")
    test_videos = find_test_videos()
    logger.info(f"Found {len(test_videos)} test videos")

    if test_videos:
        add_to_database(test_videos)
        logger.info("Test videos added to database")
    else:
        logger.info("No test videos found")


if __name__ == "__main__":
    main()
