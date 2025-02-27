import cv2  # Import OpenCV library for computer vision tasks
import numpy as np  # Import NumPy for numerical operations
import mediapipe as mp  # Import MediaPipe for pose detection
import os  # Import OS module for file and directory operations
import json

# Function to get bottom center coordinates of rectangles
def get_rectangle_bottom_center_coordinates(boxes, indices, frame_width, frame_height):
    """
    Returns a list of normalized (x, y) coordinates representing the bottom center of each detected person rectangle.
    
    Args:
        boxes: List of detected bounding boxes [x, y, w, h]
        indices: Indices of valid detections after NMS
        frame_width: Width of the frame
        frame_height: Height of the frame
        
    Returns:
        List of (x, y) tuples as normalized coordinates (0-1 range)
    """
    coordinates = []  # Initialize empty list to store coordinates
    
    if indices is not None and len(indices) > 0:  # Check if any valid detections exist
        for i in indices.flatten():  # Loop through each valid detection index
            x, y, w, h = boxes[i]  # Extract the box coordinates and dimensions
            
            # Calculate bottom center of rectangle
            bottom_center_x = x + (w // 2)  # X coordinate is halfway across the width
            bottom_center_y = y + h  # Y coordinate is at the bottom of the box
            
            # Normalize coordinates (0-1 range)
            normalized_x = bottom_center_x / frame_width
            normalized_y = bottom_center_y / frame_height
            
            coordinates.append((normalized_x, normalized_y, bottom_center_x, bottom_center_y))
    
    return coordinates  # Return the list of coordinates

# store json
os.makedirs("website/data", exist_ok=True)
base = "website/data"
output_json = os.path.join(base, "coordinates.json") # directory to save
pose_data = {}

# Load YOLO files
base_path = "website\\yolo"  # Base directory for YOLO model files
config_path = os.path.join(base_path, "yolov3.cfg")  # Path to YOLO configuration file
weights_path = os.path.join(base_path, "yolov3.weights")  # Path to YOLO model weights
names_path = os.path.join(base_path, "coco.names")  # Path to COCO class names

# Load class names from YOLO
with open(names_path, "r") as f:  # Open the class names file
    classes = [line.strip() for line in f.readlines()]  # Read and strip each line to get class names

# Define class person only
person_idx = classes.index("person")  # Get the index of the 'person' class for filtering

# Load YOLO model
net = cv2.dnn.readNetFromDarknet(config_path, weights_path)  # Load YOLO model from config and weights
layer_names = net.getLayerNames()  # Get all layer names in the network
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers().flatten()]  # Get output layer names

# Set up Mediapipe Pose
mp_pose = mp.solutions.pose  # Initialize MediaPipe pose solution
mp_drawing = mp.solutions.drawing_utils  # Initialize MediaPipe drawing utilities

# Video processing
video_path = "website/uploads/test.mp4"  # Path to the input video
cap = cv2.VideoCapture(video_path)  # Open the video file
fps = cap.get(cv2.CAP_PROP_FPS) # Get fps from video

# Define processing interval
process_every_n_frames = int(fps * 2)  # Process only every 120th frame to reduce computation
frame_count = int(fps * 4)  # Initialize frame counter

# Create output directory
output_dir = "website/static/images"  # Directory where output images will be saved
os.makedirs(output_dir, exist_ok=True)  # Create directory if it doesn't exist

# Initialize MediaPipe pose detector with specified parameters
with mp_pose.Pose(static_image_mode=False,  # Set to false for video
                  min_detection_confidence=0.5,  # Minimum confidence to consider a detection valid
                  min_tracking_confidence=0.5) as pose:  # Minimum confidence to keep tracking

    while cap.isOpened():  # Loop while the video is open
        ret, frame = cap.read()  # Read a frame from the video
        if not ret:  # If frame reading failed (end of video)
            break  # Exit the loop

        frame_count += 1  # Increment the frame counter
        height, width, _ = frame.shape  # Get frame dimensions

        # Process only certain frames based on the interval and frame count limit
        if frame_count % process_every_n_frames == 0:  # Process every nth frame up to frame 1080
            if frame_count == 540:
                break

            frame_key = f"frame_{int(frame_count / 60)}" # Key of each frame that process
            pose_data[frame_key] = [] # List for store data of each person
            
            # Also store frame dimensions in the JSON
            pose_data[frame_key].append({
                "frame_info": {
                    "width": width,
                    "height": height
                }
            })

            # Prepare the frame for YOLO model (resize, normalize, etc.)
            blob = cv2.dnn.blobFromImage(frame, scalefactor=1/255.0, size=(416, 416),
                                         swapRB=True, crop=False)  # Convert frame to blob for neural network
            net.setInput(blob)  # Set the input to the neural network
            detections = net.forward(output_layers)  # Forward pass through the network to get detections

            boxes, confidences = [], []  # Initialize empty lists for bounding boxes and confidence scores

            # Process YOLO output
            for output in detections:  # For each output layer
                for detection in output:  # For each detection in the output
                    scores = detection[5:]  # Get class scores (starts at index 5)
                    class_id = np.argmax(scores)  # Get the class ID with highest score
                    confidence = scores[class_id]  # Get the confidence value for that class
                    if class_id == person_idx and confidence > 0.5:  # If it's a person with confidence > 0.5
                        center_x = int(detection[0] * width)  # Scale x-center to image width
                        center_y = int(detection[1] * height)  # Scale y-center to image height
                        w, h = int(detection[2] * width), int(detection[3] * height)  # Scale width and height
                        x, y = max(0, center_x - w // 2), max(0, center_y - h // 2)  # Calculate top-left corner
                        boxes.append([x, y, w, h])  # Add bounding box to list
                        confidences.append(float(confidence))  # Add confidence to list

            # Apply non-max suppression to remove overlapping boxes
            indices = cv2.dnn.NMSBoxes(boxes, confidences, score_threshold=0.5, nms_threshold=0.4)  
            
            # Get bottom center coordinates of all detected people
            bottom_center_coords = get_rectangle_bottom_center_coordinates(boxes, indices, width, height)  # Get coordinates using our function
            
            # Visualize bottom center points and process person ROIs
            if indices is not None and len(indices) > 0:  # If any detections remain after NMS
                for i, (normalized_x, normalized_y, original_x, original_y) in enumerate(bottom_center_coords):  # Loop through each coordinate

                    # Loop save coord each person
                    person_info = {
                        "person_id": i + 1,  # กำหนดหมายเลขนักเต้น
                        "coordinates": {
                            "normalized": {
                                "x": normalized_x,
                                "y": normalized_y
                            },
                            "original": {
                                "x": int(original_x),
                                "y": int(original_y)
                            }
                        }
                    }
                    pose_data[frame_key].append(person_info)  # เพิ่มข้อมูลลงใน dictionary

                    box_idx = indices.flatten()[i]  # Get the corresponding box index
                    x, y, w, h = boxes[box_idx]  # Get the box dimensions
                    person_roi = frame[y:y+h, x:x+w]  # Extract the region of interest for the person

                    # Detect pose using MediaPipe
                    roi_rgb = cv2.cvtColor(person_roi, cv2.COLOR_BGR2RGB)  # Convert ROI to RGB for MediaPipe
                    roi_rgb.flags.writeable = False  # Set flag to improve performance
                    results = pose.process(roi_rgb)  # Process the ROI to detect pose
                    roi_rgb.flags.writeable = True  # Reset the flag

                # Save the processed frame as an image
                output_path = os.path.join(output_dir, f"image{int(frame_count / 60)}.jpg")  # Define output path
                output_path_data = {'path': output_path}
                pose_data[frame_key].append(output_path_data)
                cv2.imwrite(output_path, frame)  # Save the image
            
            # บันทึกข้อมูลลงไฟล์ JSON
            with open(output_json, "w") as json_file:
                json.dump(pose_data, json_file, indent=4)

        # Exit the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'): 
            break  

# Release resources
cap.release()  # Release the video capture object
cv2.destroyAllWindows()  # Close all OpenCV windows