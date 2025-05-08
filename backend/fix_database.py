import sqlite3
import os
import glob
import json
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def fix_database():
    """Fix common database issues by checking the videos and users tables"""
    # Connect to database
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()

    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        logger.error("Users table does not exist! Creating it...")
        cursor.execute(
            """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1
        )
        """
        )

        # Create admin user
        import bcrypt

        password = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            "INSERT INTO users (id, email, hashed_password, is_active) VALUES (1, ?, ?, 1)",
            ("admin@example.com", password),
        )
        logger.info("Created admin user: admin@example.com / password123")

    # Check if videos table exists
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='videos'"
    )
    if not cursor.fetchone():
        logger.error("Videos table does not exist! Creating it...")
        cursor.execute(
            """
        CREATE TABLE videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            file_path TEXT,
            original_filename TEXT,
            status TEXT NOT NULL,
            error_message TEXT,
            result_path TEXT,
            json_result_path TEXT,
            model_size TEXT,
            processing_time REAL,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            user_id INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
        )
        logger.info("Created videos table")

    # Ensure all videos have user_id = 1
    cursor.execute("UPDATE videos SET user_id = 1 WHERE user_id IS NULL OR user_id = 0")
    logger.info(f"Updated {cursor.rowcount} videos to have user_id = 1")

    # Check for videos with missing files and update their status
    cursor.execute("SELECT id, file_path, result_path, json_result_path FROM videos")
    videos = cursor.fetchall()

    for video_id, file_path, result_path, json_result_path in videos:
        if file_path and not os.path.exists(file_path):
            logger.warning(f"Video {video_id}: Original file missing: {file_path}")

        # If status is completed but result files are missing, update status
        if result_path and not os.path.exists(result_path):
            logger.warning(f"Video {video_id}: Result file missing: {result_path}")
            cursor.execute(
                "UPDATE videos SET status = 'error', error_message = 'Result files missing' WHERE id = ?",
                (video_id,),
            )
            logger.info(f"Updated video {video_id} status to 'error'")

    # Look for orphaned files in the results directory
    results_files = glob.glob("results/*_processed.mp4")
    for result_file in results_files:
        base_name = os.path.basename(result_file).replace("_processed.mp4", "")

        # Check if this file is in the database
        cursor.execute("SELECT id FROM videos WHERE result_path = ?", (result_file,))
        if not cursor.fetchone():
            # Add to database
            logger.info(f"Found orphaned result file: {result_file}")

            # Check for corresponding JSON
            json_path = f"results/{base_name}_results.json"
            if os.path.exists(json_path):
                # Add to database with user_id 1
                cursor.execute(
                    """
                    INSERT INTO videos 
                    (name, file_path, status, result_path, json_result_path, model_size, user_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                    """,
                    (
                        f"Recovered {base_name}",
                        result_file,  # Using result as original since we don't have it
                        "completed",
                        result_file,
                        json_path,
                        "auto",
                        1,  # Admin user
                    ),
                )
                logger.info(f"Added orphaned video {base_name} to database")

    # Commit changes
    conn.commit()
    conn.close()
    logger.info("Database fixes applied successfully")


if __name__ == "__main__":
    fix_database()
