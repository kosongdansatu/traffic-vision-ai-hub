import os
import sqlite3
import shutil
import cv2
import json
import traceback
from app.ai import process_video

# Video ID yang harus diperbaiki
video_id = 2

# Database connection
conn = sqlite3.connect("app.db")
cursor = conn.cursor()

# Get the video info
cursor.execute(
    "SELECT id, file_path, name, model_size FROM videos WHERE id = ?", (video_id,)
)
video = cursor.fetchone()

if not video:
    print(f"Video dengan ID {video_id} tidak ditemukan!")
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

    # Verify the results
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            data = json.load(f)

        frames_count = len(data.get("frames", []))
        tracked_objects = False

        for frame in data.get("frames", [])[:5]:  # Check first 5 frames
            if "tracked_objects" in frame and frame["tracked_objects"]:
                tracked_objects = True
                break

        print(f"Verification: JSON has {frames_count} frames")
        if tracked_objects:
            print("Tracked objects are present in the results")
        else:
            print("WARNING: Tracked objects are missing from the results!")

    # Check if the processed video actually has annotations
    if os.path.exists(result_path):
        cap = cv2.VideoCapture(result_path)
        ret, frame = cap.read()
        if ret:
            # Save a sample frame to check for annotations
            sample_path = f"results/{file_id}_sample_frame.jpg"
            cv2.imwrite(sample_path, frame)
            print(f"Saved sample frame to {sample_path} for visual inspection")
        cap.release()

except Exception as e:
    print(f"Error processing video: {str(e)}")
    print(traceback.format_exc())
    cursor.execute(
        "UPDATE videos SET status = 'failed', error_message = ? WHERE id = ?",
        (str(e)[:200], video_id),
    )
    conn.commit()

# Close database connection
conn.close()
