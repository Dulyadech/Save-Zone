import cv2
import numpy as np
import mediapipe as mp
import os
import json

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

def process_video(
    video_path="website/uploads/badvillain.mp4",
    output_dir="website/static/output_images",
    output_json_path="website/static/data/coordinates.json",
    yolo_base_path="website/yolo",
    process_interval_seconds=2,
    max_process_seconds=None,  # Set to None to process the entire video
    confidence_threshold=0.5
):
    """
    Process a video to detect people, track their positions, and save the data.
    
    Args:
        video_path (str): Path to the input video file
        output_dir (str): Directory to save output images
        output_json_path (str): Path to save the output JSON data
        yolo_base_path (str): Base path for YOLO model files
        process_interval_seconds (int): Process a frame every N seconds
        max_process_seconds (int, optional): Stop processing after this many seconds.
                                            If None, processes the entire video.
        confidence_threshold (float): Confidence threshold for detections
        
    Returns:
        dict: The pose data collected during processing
    """
    # Ensure output directories exist
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize pose data dictionary
    pose_data = {}
    
    # Load YOLO files
    config_path = os.path.join(yolo_base_path, "yolov3.cfg")
    weights_path = os.path.join(yolo_base_path, "yolov3.weights")
    names_path = os.path.join(yolo_base_path, "coco.names")
    
    # Load class names from YOLO
    with open(names_path, "r") as f:
        classes = [line.strip() for line in f.readlines()]
    
    # Define class person only
    person_idx = classes.index("person")
    
    # Load YOLO model
    net = cv2.dnn.readNetFromDarknet(config_path, weights_path)
    layer_names = net.getLayerNames()
    output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers().flatten()]
    
    # Set up Mediapipe Pose
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    
    # Open the video
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Define processing intervals based on FPS
    process_every_n_frames = int(fps * process_interval_seconds)
    
    # Calculate max frames if a time limit is specified
    max_frames = None
    if max_process_seconds is not None:
        max_frames = int(fps * max_process_seconds)
    
    frame_count = 0
    processed_count = 0  # Counter for processed frames (for sequential naming)
    
    # Initialize MediaPipe pose detector
    with mp_pose.Pose(
        static_image_mode=False,
        min_detection_confidence=confidence_threshold,
        min_tracking_confidence=confidence_threshold
    ) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            # Check if we've reached the maximum frames to process
            if max_frames is not None and frame_count >= max_frames:
                break
            
            # Process only at specified intervals
            if frame_count % process_every_n_frames == 0:
                processed_count += 1  # Increment the counter for processed frames
                
                height, width, _ = frame.shape
                frame_key = f"frame_{processed_count}"  # Key using sequential number
                pose_data[frame_key] = []
                
                # Store frame dimensions and information
                pose_data[frame_key].append({
                    "frame_info": {
                        "width": width,
                        "height": height,
                        "frame_number": frame_count,
                        "timestamp": frame_count / fps,  # Time in seconds
                        "sequence_number": processed_count  # Sequential number
                    }
                })
                
                # Prepare the frame for YOLO model
                blob = cv2.dnn.blobFromImage(
                    frame, 
                    scalefactor=1/255.0, 
                    size=(416, 416),
                    swapRB=True, 
                    crop=False
                )
                
                net.setInput(blob)
                detections = net.forward(output_layers)
                
                boxes, confidences = [], []
                
                # Process YOLO output
                for output in detections:
                    for detection in output:
                        scores = detection[5:]
                        class_id = np.argmax(scores)
                        confidence = scores[class_id]
                        
                        if class_id == person_idx and confidence > confidence_threshold:
                            center_x = int(detection[0] * width)
                            center_y = int(detection[1] * height)
                            w, h = int(detection[2] * width), int(detection[3] * height)
                            x, y = max(0, center_x - w // 2), max(0, center_y - h // 2)
                            
                            boxes.append([x, y, w, h])
                            confidences.append(float(confidence))
                
                # Apply non-max suppression
                indices = cv2.dnn.NMSBoxes(
                    boxes, 
                    confidences, 
                    score_threshold=confidence_threshold, 
                    nms_threshold=0.4
                )
                
                # Get bottom center coordinates
                bottom_center_coords = get_rectangle_bottom_center_coordinates(
                    boxes, 
                    indices, 
                    width, 
                    height
                )
                
                # Process detected people
                if indices is not None and len(indices) > 0:
                    for i, (normalized_x, normalized_y, original_x, original_y) in enumerate(bottom_center_coords):
                        # Save person information
                        person_info = {
                            "person_id": i + 1,
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
                        pose_data[frame_key].append(person_info)
                        
                        # Extract person ROI and detect pose
                        box_idx = indices.flatten()[i]
                        x, y, w, h = boxes[box_idx]
                        person_roi = frame[y:y+h, x:x+w]
                        
                        # Process with MediaPipe
                        if person_roi.size > 0:  # Check if ROI is not empty
                            roi_rgb = cv2.cvtColor(person_roi, cv2.COLOR_BGR2RGB)
                            roi_rgb.flags.writeable = False
                            results = pose.process(roi_rgb)
                            roi_rgb.flags.writeable = True
                    
                    # Save the processed frame with sequential numbering
                    output_path = os.path.join(output_dir, f"image{processed_count}.jpg")
                    output_path_data = {'path': f"static/output_images/image{processed_count}.jpg"}
                    pose_data[frame_key].append(output_path_data)
                    cv2.imwrite(output_path, frame)
                
                # Save JSON data after each processed frame
                with open(output_json_path, "w") as json_file:
                    json.dump(pose_data, json_file, indent=4)
                
                # Print progress
                if max_frames:
                    print(f"Processing: {frame_count}/{max_frames} frames ({frame_count/max_frames*100:.1f}%) - Saved as image{processed_count}.jpg")
                else:
                    print(f"Processing: {frame_count}/{total_frames} frames ({frame_count/total_frames*100:.1f}%) - Saved as image{processed_count}.jpg")
            
            # Exit the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    # Release resources
    cap.release()
    cv2.destroyAllWindows()
    
    print(f"Video processing complete. Processed {processed_count} frames.")
    return pose_data

if __name__ == "__main__":
    # This block executes only if the script is run directly (not imported)
    process_video(max_process_seconds=None)  # Process the entire video