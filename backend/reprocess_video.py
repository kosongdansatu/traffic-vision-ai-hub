import os
import sqlite3
import shutil
from app.ai import process_video

# Database connection
conn = sqlite3.connect("app.db")
cursor = conn.cursor()

# Get the video info
cursor.execute("SELECT id, file_path, name, model_size FROM videos WHERE id = 1")
video = cursor.fetchone()

if not video:
    print("Video not found!")
    exit(1)

video_id, file_path, video_name, model_size = video
file_id = os.path.splitext(os.path.basename(file_path))[0]

print(f"Found video: {video_name} (ID: {video_id}, Path: {file_path})")
print(f"File ID: {file_id}, Model size: {model_size}")

# Check if the video file exists
if not os.path.exists(file_path):
    print(f"Error: Video file not found at {file_path}")
    exit(1)

# Delete existing result files
results_path = f"results/{file_id}_processed.mp4"
json_path = f"results/{file_id}_results.json"
thumbnail_path = f"results/{file_id}_thumbnail.jpg"

for path in [results_path, json_path, thumbnail_path]:
    if os.path.exists(path):
        print(f"Deleting {path}")
        os.remove(path)

# Update video status to pending
cursor.execute(
    "UPDATE videos SET status = 'pending', result_path = NULL, json_result_path = NULL WHERE id = ?",
    (video_id,),
)
conn.commit()
print("Video status reset to 'pending'")

# Process the video
print(f"Starting video processing with model size: {model_size}")
try:
    # Update status to processing
    cursor.execute("UPDATE videos SET status = 'processing' WHERE id = ?", (video_id,))
    conn.commit()

    # Process the video
    result_path, json_path = process_video(file_path, file_id, model_size)

    # Update video status and paths
    cursor.execute(
        "UPDATE videos SET status = 'completed', result_path = ?, json_result_path = ? WHERE id = ?",
        (result_path, json_path, video_id),
    )
    conn.commit()
    print(f"Video processing completed successfully!")
    print(f"Results saved to: {result_path} and {json_path}")

except Exception as e:
    print(f"Error processing video: {str(e)}")
    cursor.execute(
        "UPDATE videos SET status = 'failed', error_message = ? WHERE id = ?",
        (str(e)[:200], video_id),
    )
    conn.commit()

# Close database connection
conn.close()
