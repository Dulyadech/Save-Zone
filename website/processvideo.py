import cv2, numpy as np, mediapipe as mp, json, io
from datetime import datetime, timedelta
from . import db
from .models import VideoUpload, VideoImage, Zone

utc_time = datetime.utcnow()
gmt_plus_7_time = utc_time + timedelta(hours=7)

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

def process_and_save_video(
    video_id,
    yolo_base_path="website/yolo",
    process_interval_seconds=2,
    max_process_seconds=None,  # Set to None to process the entire video
    confidence_threshold=0.5
):
    """
    Process a video to detect people, track their positions, and save the data to the database.
    
    Args:
        video_id (int): Database ID of the video to process
        yolo_base_path (str): Base path for YOLO model files
        process_interval_seconds (int): Process a frame every N seconds
        max_process_seconds (int, optional): Stop processing after this many seconds.
                                            If None, processes the entire video.
        confidence_threshold (float): Confidence threshold for detections
        
    Returns:
        bool: True if processing was successful, False otherwise
    """
    # Retrieve the video from the database
    video_record = VideoUpload.query.get(video_id)
    if not video_record:
        print(f"Error: Video with ID {video_id} not found in database")
        return False
    
    # Create video buffer from binary data
    video_buffer = io.BytesIO(video_record.file_data)
    
    # Load YOLO files
    config_path = f"{yolo_base_path}/yolov3.cfg"
    weights_path = f"{yolo_base_path}/yolov3.weights"
    names_path = f"{yolo_base_path}/coco.names"
    
    # Check if YOLO files exist
    import os
    if not all(os.path.exists(p) for p in [config_path, weights_path, names_path]):
        print(f"Error: YOLO model files not found in {yolo_base_path}")
        # Ensure directory exists
        os.makedirs(yolo_base_path, exist_ok=True)
        # You might want to add code to download YOLO files if they don't exist
        return False
    
    # Load class names from YOLO
    with open(names_path, "r") as f:
        classes = [line.strip() for line in f.readlines()]
    
    # Define class person only
    person_idx = classes.index("person")
    
    # Load YOLO model
    net = cv2.dnn.readNetFromDarknet(config_path, weights_path)
    layer_names = net.getLayerNames()
    
    # Handle different OpenCV versions for getting unconnected out layers
    try:
        output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers().flatten()]
    except:
        output_layers = [layer_names[i[0] - 1] for i in net.getUnconnectedOutLayers()]
    
    # Set up Mediapipe Pose
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    
    # Write video buffer to a temporary file that OpenCV can read
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
        temp_file.write(video_record.file_data)
        temp_video_path = temp_file.name
    
    # Open the video
    cap = cv2.VideoCapture(temp_video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video from buffer")
        # Clean up temporary file
        os.unlink(temp_video_path)
        return False
        
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
                
                # Make a copy of the original frame for visualization (if needed)
                visualization_frame = frame.copy()
                
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
                
                pose_data = []

                ref_frame = {"frame_reference" : processed_count}
                pose_data.append(ref_frame)

                # Process detected people
                if indices is not None and len(indices) > 0:
                    for i, (normalized_x, normalized_y, original_x, original_y) in enumerate(bottom_center_coords):
                        # Save person information
                        person_info = {
                            "person_id": i + 1,
                            "coordinates": {
                                    "x": normalized_x,
                                    "y": normalized_y
                            }
                        }
                        pose_data.append(person_info)
                        
                        # Draw bounding box and label on the visualization frame only
                        # No more drawing on the original frame that will be saved
                        box_idx = indices.flatten()[i]
                        x, y, w, h = boxes[box_idx]
                        
                        # Draw bounding box and label on the visualization frame (not the frame to be saved)
                        cv2.rectangle(visualization_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                        cv2.putText(visualization_frame, f"Person {i+1}", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                # Encode the original frame (without boxes) to JPEG
                success, encoded_frame = cv2.imencode('.jpg', frame)
                
                if success:
                    # Save to database - create a new VideoImage record
                    try:
                        image_binary = encoded_frame.tobytes()
                        frame_filename = f"frame_{video_id}_{processed_count}.jpg"
                        
                        # Create VideoImage record
                        video_image = VideoImage(
                            filename=frame_filename,
                            content_type='image/jpeg',
                            image_data=image_binary,
                            image_size=len(image_binary),
                            timestamp=frame_count / fps,
                            width=width,
                            height=height,
                            person_count=len(bottom_center_coords) if indices is not None else 0,
                            video_id=video_id
                        )

                        zone = Zone(
                            frame_reference = processed_count,
                            coordinates=json.dumps(pose_data),
                            video_id=video_id
                        )
                        
                        db.session.add(video_image)
                        db.session.add(zone)
                        db.session.commit()
                        
                    except Exception as e:
                        print(f"Error saving frame to database: {e}")
                        db.session.rollback()
                
                # Print progress
                if max_frames:
                    print(f"Processing: {frame_count}/{max_frames} frames ({frame_count/max_frames*100:.1f}%)")
                else:
                    print(f"Processing: {frame_count}/{total_frames} frames ({frame_count/total_frames*100:.1f}%)")
            
            # Exit the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    # Release resources
    cap.release()
    cv2.destroyAllWindows()
    
    # Remove the temporary video file
    try:
        os.unlink(temp_video_path)
    except:
        pass
    
    # Update the video record to mark as processed
    try:
        video_record.processed = True
        db.session.commit()
        print(f"Video processing complete. Processed {processed_count} frames and saved to database.")
        return True
    except Exception as e:
        print(f"Error updating video record: {e}")
        db.session.rollback()
        return False

def check_positions_in_zones(video_id, threshold_distance=0.1):
    """
    Check if detected person positions are within defined zones and update the database.
    
    Args:
        video_id (int): Database ID of the video to analyze
        threshold_distance (float): Threshold distance for considering a position inside a zone
                                   (as a fraction of the normalized coordinate space)
    
    Returns:
        dict: Statistics of zone triggers
    """
    # Get all zones for this video
    zones = Zone.query.filter_by(video_id=video_id).all()
    
    # Get all processed frames for this video
    images = VideoImage.query.filter_by(video_id=video_id).order_by(VideoImage.timestamp).all()
    
    stats = {
        "total_frames": len(images),
        "total_zones": len(zones),
        "zone_triggers": {}
    }
    
    # Initialize zone trigger counts
    for zone in zones:
        stats["zone_triggers"][zone.id] = {
            "zone_name": zone.name,
            "trigger_count": 0,
            "is_dance_position": zone.is_dance_position
        }
    
    # For each frame, check if any detected person is in any zone
    for image in images:
        # Parse the frame info from JSON
        try:
            frame_data = json.loads(image.frame_info)
            
            # Extract person positions
            person_positions = []
            for item in frame_data:
                if isinstance(item, dict) and "person_id" in item:
                    # Get normalized coordinates
                    normalized_x = item["coordinates"]["normalized"]["x"]
                    normalized_y = item["coordinates"]["normalized"]["y"]
                    person_positions.append((normalized_x, normalized_y, item["person_id"]))
            
            # Check each person against each zone
            for zone in zones:
                try:
                    zone_coords = None
                    if zone.normalized_coordinates:
                        zone_coords = json.loads(zone.normalized_coordinates)
                    elif hasattr(zone, 'coordinates') and zone.coordinates:
                        zone_coords = json.loads(zone.coordinates)
                    
                    if zone_coords:
                        # For each person, check if they're in the zone
                        for pos_x, pos_y, person_id in person_positions:
                            if is_point_in_zone(pos_x, pos_y, zone_coords, threshold_distance):
                                # Update zone trigger count
                                stats["zone_triggers"][zone.id]["trigger_count"] += 1
                                
                                # Add trigger information to database if needed
                                # This could be tracked in a new model if needed
                                
                except json.JSONDecodeError:
                    print(f"Error parsing zone coordinates for zone {zone.id}")
        
        except Exception as e:
            print(f"Error processing frame {image.id}: {e}")
    
    return stats

def is_point_in_zone(x, y, zone_coordinates, threshold=0.1):
    """
    Check if a point is inside or near a defined zone.
    
    Args:
        x, y: Normalized coordinates of the point to check
        zone_coordinates: List of normalized (x, y) coordinates defining the zone
        threshold: Distance threshold for considering a point "near" the zone
        
    Returns:
        bool: True if the point is in or near the zone, False otherwise
    """
    # Ensure zone_coordinates is a list of points
    if not isinstance(zone_coordinates, list):
        return False
    
    # Simple polygon containment check
    inside = False
    n = len(zone_coordinates)
    
    if n < 3:  # Not a polygon
        return False
    
    # For polygon containment
    for i in range(n):
        j = (i - 1) % n
        if ((zone_coordinates[i]["y"] > y) != (zone_coordinates[j]["y"] > y)) and \
           (x < zone_coordinates[i]["x"] + (zone_coordinates[j]["x"] - zone_coordinates[i]["x"]) * 
            (y - zone_coordinates[i]["y"]) / (zone_coordinates[j]["y"] - zone_coordinates[i]["y"])):
            inside = not inside
    
    # If not inside, check if it's near any edge of the zone
    if not inside:
        for i in range(n):
            j = (i + 1) % n
            # Calculate point-to-line distance
            dist = point_to_line_distance(
                x, y, 
                zone_coordinates[i]["x"], zone_coordinates[i]["y"],
                zone_coordinates[j]["x"], zone_coordinates[j]["y"]
            )
            if dist < threshold:
                return True
    
    return inside

def point_to_line_distance(px, py, x1, y1, x2, y2):
    """
    Calculate the distance from a point to a line segment.
    
    Args:
        px, py: Point coordinates
        x1, y1, x2, y2: Line segment endpoints
        
    Returns:
        float: Distance from point to line segment
    """
    # Line length
    line_length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    if line_length == 0:
        return np.sqrt((px - x1)**2 + (py - y1)**2)
    
    # Calculate projection
    t = max(0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (line_length**2)))
    
    # Calculate closest point on the line segment
    proj_x = x1 + t * (x2 - x1)
    proj_y = y1 + t * (y2 - y1)
    
    # Return distance to closest point
    return np.sqrt((px - proj_x)**2 + (py - proj_y)**2)