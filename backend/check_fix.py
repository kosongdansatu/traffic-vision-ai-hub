import json
import os

# Path to the fixed JSON file
json_path = "results/c9b9f6f0-799c-4d3a-8b3a-958e6503d87b_results.json"

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

print(f"Total frames: {total_frames}")
print(f"Frames with tracked_objects: {frames_with_tracked_objects}")

if frames_with_tracked_objects == total_frames:
    print("All frames now have tracked_objects data!")
else:
    print(
        f"Only {frames_with_tracked_objects}/{total_frames} frames have tracked_objects data"
    )

# Check the first frame's tracked_objects
if data.get("frames") and "tracked_objects" in data["frames"][0]:
    first_frame = data["frames"][0]
    print(f"\nFirst frame has {len(first_frame['tracked_objects'])} tracked objects")

    if first_frame["tracked_objects"]:
        print("\nExample of a tracked object:")
        print(json.dumps(first_frame["tracked_objects"][0], indent=2))
else:
    print("First frame doesn't have tracked_objects data")
