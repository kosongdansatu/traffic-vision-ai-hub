import json
import os

# Path to JSON result file
json_path = "results/c9b9f6f0-799c-4d3a-8b3a-958e6503d87b_results.json"

if not os.path.exists(json_path):
    print(f"File not found: {json_path}")
    exit(1)

# Load JSON data
with open(json_path, "r") as f:
    data = json.load(f)

# Check for tracked_objects in frames
print(f"Total frames in JSON: {len(data.get('frames', []))}")

# Check total counts
print("\nTotal vehicle counts:")
for vehicle_type, count in data.get("total_counts", {}).items():
    print(f"{vehicle_type}: {count}")

# Check overall statistics
print("\nProcessing statistics:")
stats = data.get("processing_stats", {})
for key, value in stats.items():
    print(f"{key}: {value}")

# Check unique vehicles
print("\nUnique vehicle counts:")
for vehicle_type, count in data.get("unique_vehicles", {}).items():
    print(f"{vehicle_type}: {count}")

# Check if tracked_objects exists in some frames
frame_with_objects = False
for i, frame in enumerate(data.get("frames", [])[:100]):  # Check first 100 frames
    if "tracked_objects" in frame:
        frame_with_objects = True
        print(
            f"\nFrame {i} has tracked_objects with {len(frame['tracked_objects'])} objects"
        )
        if len(frame["tracked_objects"]) > 0:
            print("Example tracked object:")
            print(json.dumps(frame["tracked_objects"][0], indent=2))
        break

if not frame_with_objects:
    print("\nNo 'tracked_objects' field found in the first 100 frames")

    # Check first frame structure
    if data.get("frames"):
        print("\nFirst frame structure:")
        print(json.dumps(data["frames"][0], indent=2))

# Look for the word "tracked" anywhere in the JSON
with open(json_path, "r") as f:
    content = f.read()
    if "tracked" in content:
        print("\nThe word 'tracked' appears in the JSON file")
    else:
        print("\nThe word 'tracked' does NOT appear in the JSON file")
