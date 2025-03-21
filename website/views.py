from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_required, current_user
import os
import json
from werkzeug.utils import secure_filename
from .processvideo import process_video
from . import db
from .models import VideoUpload, VideoImage, Zone

views = Blueprint('views', __name__)

UPLOAD_FOLDER = 'website/uploads'
OUTPUT_FOLDER = 'website/static/output_images'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

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
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # Save file info to the database
            new_video = VideoUpload(
                filename=filename, 
                content_type=filename.rsplit('.', 1)[1].lower(),
                original_filepath=filepath,
                user_id=current_user.id,
                file_data=file.read()
            )
            db.session.add(new_video)
            db.session.commit()
            
            # Process the video
            # pose_data = process_video(video_path=filepath, max_process_seconds=30)
            
            # Store the extracted frames in the database
            # for frame_key, frame_data in pose_data.items():
            #     frame_info = next((item for item in frame_data if "frame_info" in item), None)
            #     output_path = next((item for item in frame_data if "path" in item), None)
                
            #     if frame_info and output_path:
            #         new_image = VideoImage(
            #             filename=os.path.basename(output_path['path']),
            #             filepath=output_path['path'],
            #             frame_number=frame_info['frame_info']['frame_number'],
            #             timestamp=frame_info['frame_info']['timestamp'],
            #             video_id=new_video.id
            #         )
            #         db.session.add(new_image)
            
            # Update video as processed
            new_video.processed = True
            db.session.commit()

            flash('Upload and processing successful!', 'success')
            return redirect(url_for('views.previews'))
    
    return render_template('upload.html')

@views.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    videos = VideoUpload.query.filter_by(user_id=current_user.id, processed=True).all()
    
    if request.method == 'POST':
        video_id = request.form.get('video_id')
        zone_name = request.form.get('zone_name')
        zone_description = request.form.get('zone_description')
        zone_coordinates = request.form.get('zone_coordinates')
        is_danger = True if request.form.get('is_danger_zone') == 'danger' else False
        
        # Validate inputs
        if not all([video_id, zone_name, zone_coordinates]):
            flash('Please fill in all required fields', 'danger')
        else:
            new_zone = Zone(
                name=zone_name,
                description=zone_description,
                coordinates=zone_coordinates,
                is_danger_zone=is_danger,
                user_id=current_user.id,
                video_id=video_id
            )
            db.session.add(new_zone)
            db.session.commit()
            
            flash('Zone created successfully!', 'success')
            return redirect(url_for('views.previews'))
    
    return render_template('create.html', videos=videos)

@views.route('/previews')
@login_required
def previews():
    videos = VideoUpload.query.filter_by(user_id=current_user.id).all()
    zones = Zone.query.filter_by(user_id=current_user.id).all()
    return render_template('preview_&_edit.html', videos=videos, zones=zones)

@views.route('/video/<int:video_id>')
@login_required
def video_details(video_id):
    video = VideoUpload.query.get_or_404(video_id)
    
    # Check if the user is authorized to view this video
    if video.user_id != current_user.id:
        flash('You are not authorized to view this video', 'danger')
        return redirect(url_for('views.previews'))
        
    images = VideoImage.query.filter_by(video_id=video_id).all()
    zones = Zone.query.filter_by(video_id=video_id).all()
    
    return render_template('video_details.html', video=video, images=images, zones=zones)

@views.route('/about')
def about():
    return render_template('about_us.html')