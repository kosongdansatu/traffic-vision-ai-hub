import json
import os

# Path to the fixed JSON file for video #2
json_path = "results/37bc36e8-3867-4f37-96cb-c545b6f9bb6b_results.json"

if not os.path.exists(json_path):
    print(f"File not found: {json_path}")
    exit(1)

# Load the JSON data
with open(json_path, "r") as f:
    data = json.load(f)

# Check for tracked_objects in frames
total_frames = len(data.get("frames", []))
frames_with_tracked_objects = sum(
    1 for frame in data.get("frames", []) if "tracked_objects" in frame
)
frames_with_objects = sum(
    1
    for frame in data.get("frames", [])
    if "tracked_objects" in frame and frame["tracked_objects"]
)

print(f"Total frames: {total_frames}")
print(f"Frames with tracked_objects field: {frames_with_tracked_objects}")
print(f"Frames with actual tracked objects (non-empty): {frames_with_objects}")

if frames_with_tracked_objects == total_frames:
    print("All frames have tracked_objects field")
else:
    print(
        f"Only {frames_with_tracked_objects}/{total_frames} frames have tracked_objects field"
    )

# Check the first frame's tracked_objects
if data.get("frames") and "tracked_objects" in data["frames"][0]:
    first_frame = data["frames"][0]
    print(f"\nFirst frame has {len(first_frame['tracked_objects'])} tracked objects")

    if first_frame["tracked_objects"]:
        print("\nExample of a tracked object:")
        print(json.dumps(first_frame["tracked_objects"][0], indent=2))

    print("\nFrames with objects:")
    count = 0
    for i, frame in enumerate(data["frames"]):
        if frame.get("tracked_objects"):
            count += 1
            if count <= 5:  # Print first 5 frames with objects
                print(f"  Frame {i}: {len(frame['tracked_objects'])} objects")
    print(f"Total frames with objects: {count}")
else:
    print("First frame doesn't have tracked_objects data")

# Check unique vehicles
print("\nUnique vehicle counts:")
for vehicle_type, count in data.get("unique_vehicles", {}).items():
    print(f"{vehicle_type}: {count}")

# Get total number of tracked objects
total_objects = sum(
    len(frame.get("tracked_objects", [])) for frame in data.get("frames", [])
)
print(f"\nTotal tracked objects across all frames: {total_objects}")
