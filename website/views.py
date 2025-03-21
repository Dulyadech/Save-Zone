from flask import Blueprint, render_template, request, flash, redirect, send_from_directory, url_for, Response, jsonify
from flask_login import login_required, current_user
import json, sqlite3, base64, os
from werkzeug.utils import secure_filename
from .processvideo import process_and_save_video, check_positions_in_zones
from . import db
from .models import VideoUpload, VideoImage, Zone

views = Blueprint('views', __name__)

def allowed_file(filename):
    allowed_extensions = {'mp4', 'avi', 'mov'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@views.route('/')
def home():
    return render_template('index.html')

@views.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        if 'video' not in request.files:
            flash('Error: No file uploaded.', 'danger')
            return redirect(request.url)

        file = request.files['video']
        if file.filename == '':
            flash('Error: No file selected.', 'danger')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_data = file.read()
            file_size = len(file_data)

            # Save file info to the database
            new_video = VideoUpload(
                filename=filename, 
                content_type=file.content_type or f"video/{filename.rsplit('.', 1)[1].lower()}",
                user_id=current_user.id,
                file_data=file_data,
                file_size=file_size
            )
            db.session.add(new_video)
            db.session.commit()
            
            # Process the video after committing to ensure it has an ID
            success = process_and_save_video(new_video.id, max_process_seconds=30)
            
            if success:
                flash('Upload and processing successful!', 'success')
            else:
                flash('Upload successful, but there was an issue processing the video.', 'warning')
                
            return redirect(url_for('views.previews'))
        else:
            flash('Error: Unsupported file type. Please upload MP4, AVI, or MOV files.', 'danger')
    
    return render_template('upload.html')

@views.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    videos = VideoUpload.query.filter_by(user_id=current_user.id, processed=True).all()
    
    if request.method == 'POST':
        video_id = request.form.get('video_id')
        zone_name = request.form.get('zone_name')
        description = request.form.get('zone_description', '')  # Optional field
        coordinates = request.form.get('zone_coordinates')
        is_dance_position = True if request.form.get('is_dance_position') == 'yes' else False
        frame_reference = request.form.get('frame_reference')
        
        # Validate inputs
        if not all([video_id, zone_name, coordinates]):
            flash('Please fill in all required fields', 'danger')
        else:
            # Parse the coordinates to ensure they're valid JSON
            try:
                coordinate_data = json.loads(coordinates)
                
                # Create a new zone
                new_zone = Zone(
                    name=zone_name,
                    description=description,
                    coordinates=coordinates,
                    normalized_coordinates=coordinates,  # Assuming coordinates are already normalized
                    is_dance_position=is_dance_position,
                    frame_reference=frame_reference,
                    user_id=current_user.id,
                    video_id=int(video_id)
                )
                db.session.add(new_zone)
                db.session.commit()
                
                flash('Zone created successfully!', 'success')
                return redirect(url_for('views.previews'))
                
            except json.JSONDecodeError:
                flash('Invalid coordinates format. Please use valid JSON.', 'danger')
    
    return render_template('create.html', videos=videos)

@views.route('/previews')
@login_required
def previews():
    return render_template('preview_&_edit.html')

@views.route('/about')
def about():
    return render_template('about_us.html')

@views.route('/save-positions', methods=['POST'])
@login_required
def save_positions():
    try:
        # Get the updated positions data from the request
        updated_data = request.json
        video_id = request.args.get('video_id')
        
        # Validate the data structure
        if not updated_data or not video_id:
            return json.dumps({'status': 'error', 'message': 'Missing data or video_id'}), 400
        
        # Extract position data and store in database
        if request.args.get('save_as_zone') == 'true':
            # Convert the updated data format to a zone-friendly format
            position_data = {}
            for frame_key, frame_data in updated_data.items():
                people_positions = []
                for item in frame_data:
                    if isinstance(item, dict) and item.get('person_id'):
                        people_positions.append({
                            'id': item['person_id'],
                            'x': item['coordinates']['normalized']['x'],
                            'y': item['coordinates']['normalized']['y']
                        })
                
                if people_positions:
                    position_data[frame_key] = people_positions
            
            # Create a new zone with the position data
            new_zone = Zone(
                name=f"Dance Position {current_user.username}",
                description="Generated from edited positions",
                coordinates=json.dumps(position_data),
                normalized_coordinates=json.dumps(position_data),
                is_dance_position=True,
                user_id=current_user.id,
                video_id=int(video_id)
            )
            db.session.add(new_zone)
            db.session.commit()
        
        return json.dumps({'status': 'success', 'message': 'Positions saved successfully'})
    
    except Exception as e:
        return json.dumps({'status': 'error', 'message': str(e)}), 500



DATABASE_PATH = os.path.join(os.getcwd(), 'instance', 'database.db')

@views.route('/get-data', methods=['GET'])
@login_required
def get_data():
    # เชื่อมต่อกับฐานข้อมูล SQLite
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    latest_video = VideoUpload.query.filter_by(user_id=current_user.id, processed=True).order_by(VideoUpload.upload_date.desc()).first()
    
    if latest_video:
        latest_video_id = latest_video.id
    else:
        latest_video_id = None

    if latest_video_id:
        zone_data = []
        rows = cursor.execute("SELECT coordinates FROM zone WHERE video_id = ?", (latest_video.id,)).fetchall()
        for row in rows:
            try:
                zone = json.loads(row[0])
            except Exception as e:
                print("Error parsing JSON from zone:", e)
            if row[0]:
                zone_data.append(zone)
    else:
        zone_data = []
    
            

    if latest_video_id:
        images_base64 = []
        rows = cursor.execute("SELECT image_data FROM video_image WHERE video_id = ?", (latest_video_id,)).fetchall()
        for row in rows:
            if row[0]:
                img_base64 = base64.b64encode(row[0]).decode('utf-8')
                img_data_url = f"data:image/png;base64,{img_base64}"
                images_base64.append(img_data_url)
    else:
        images_base64 = []

    conn.close()

    return jsonify(images=images_base64, zones=zone_data)
