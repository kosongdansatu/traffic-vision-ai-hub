import sqlite3

# Connect to the database
conn = sqlite3.connect("app.db")
cursor = conn.cursor()

# Query videos table
print("=== Videos in the database ===")
cursor.execute(
    "SELECT id, name, status, model_size, file_path, result_path, json_result_path FROM videos ORDER BY id"
)
videos = cursor.fetchall()
for video in videos:
    print(f"ID: {video[0]}")
    print(f"Name: {video[1]}")
    print(f"Status: {video[2]}")
    print(f"Model Size: {video[3]}")
    print(f"File Path: {video[4]}")
    print(f"Result Path: {video[5]}")
    print(f"JSON Result Path: {video[6]}")
    print("-" * 30)

# Close the connection
conn.close()
