from flask import Blueprint, render_template, request, flash, redirect, url_for, Response
from flask_login import login_required, current_user
import os
import json
from werkzeug.utils import secure_filename
from .processvideo import process_and_save_video
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
        zone_description = request.form.get('zone_description')
        zone_coordinates = request.form.get('zone_coordinates')
        is_dance_position = True if request.form.get('is_dance_position') == 'yes' else False
        frame_reference = request.form.get('frame_reference')
        
        # Validate inputs
        if not all([video_id, zone_name, zone_coordinates]):
            flash('Please fill in all required fields', 'danger')
        else:
            # Parse the coordinates to ensure they're valid JSON
            try:
                json.loads(zone_coordinates)
            except json.JSONDecodeError:
                flash('Invalid coordinates format. Please use valid JSON.', 'danger')
                return render_template('create.html', videos=videos)
            
            # Create normalized coordinates based on frame dimensions
            reference_frame = VideoImage.query.filter_by(video_id=video_id, frame_number=frame_reference).first()
            normalized_coordinates = zone_coordinates  # Default if no frame is found
            
            if reference_frame:
                # For this example, we'll assume zone_coordinates is already normalized
                # In a real application, you might need to convert from pixel coordinates to normalized
                normalized_coordinates = zone_coordinates
            
            new_zone = Zone(
                name=zone_name,
                description=zone_description,
                coordinates=zone_coordinates,
                normalized_coordinates=normalized_coordinates,
                is_dance_position=is_dance_position,
                frame_reference=frame_reference,
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
    
    # Prepare data for template
    video_data = []
    for video in videos:
        # Get a sample frame for each video if available
        sample_frame = VideoImage.query.filter_by(video_id=video.id).first()
        zones = Zone.query.filter_by(video_id=video.id).all()
        
        video_data.append({
            'video': video,
            'sample_frame': sample_frame,
            'zones': zones,
            'zone_count': len(zones)
        })
    
    return render_template('preview_&_edit.html', video_data=video_data)

@views.route('/video/<int:video_id>')
@login_required
def video_details(video_id):
    video = VideoUpload.query.get_or_404(video_id)
    
    # Check if the user is authorized to view this video
    if video.user_id != current_user.id and not current_user.is_admin:
        flash('You are not authorized to view this video', 'danger')
        return redirect(url_for('views.previews'))
    
    images = VideoImage.query.filter_by(video_id=video_id).order_by(VideoImage.sequence_number).all()
    zones = Zone.query.filter_by(video_id=video_id).all()
    
    return render_template('video_details.html', video=video, images=images, zones=zones)

@views.route('/video-stream/<int:video_id>')
@login_required
def video_stream(video_id):
    video = VideoUpload.query.get_or_404(video_id)
    
    # Check if the user is authorized to view this video
    if video.user_id != current_user.id and not current_user.is_admin:
        flash('You are not authorized to view this video', 'danger')
        return redirect(url_for('views.previews'))
        
    video_data = video.file_data
    return Response(video_data, mimetype=video.content_type)

@views.route('/image/<int:image_id>')
@login_required
def image_stream(image_id):
    image = VideoImage.query.get_or_404(image_id)
    
    # Check if the user is authorized to view this image
    video = VideoUpload.query.get(image.video_id)
    if video.user_id != current_user.id and not current_user.is_admin:
        flash('You are not authorized to view this image', 'danger')
        return redirect(url_for('views.previews'))
        
    return Response(image.image_data, mimetype=image.content_type)

@views.route('/about')
def about():
    return render_template('about_us.html')

@views.route('/analyze/<int:video_id>')
@login_required
def analyze_video(video_id):
    video = VideoUpload.query.get_or_404(video_id)
    
    # Check if the user is authorized to analyze this video
    if video.user_id != current_user.id and not current_user.is_admin:
        flash('You are not authorized to analyze this video', 'danger')
        return redirect(url_for('views.previews'))
    
    # Check if video has been processed
    if not video.processed:
        flash('This video has not been processed yet.', 'warning')
        return redirect(url_for('views.video_details', video_id=video_id))
    
    # Load frame data
    frames = VideoImage.query.filter_by(video_id=video_id).order_by(VideoImage.sequence_number).all()
    zones = Zone.query.filter_by(video_id=video_id).all()
    
    # Prepare data for visualization
    frame_data = []
    for frame in frames:
        pose_data = json.loads(frame.pose_data) if frame.pose_data else []
        
        frame_info = next((item for item in pose_data if "frame_info" in item), {})
        persons = [item for item in pose_data if "person_id" in item]
        
        frame_data.append({
            'id': frame.id,
            'sequence': frame.sequence_number,
            'timestamp': frame.timestamp,
            'persons': len(persons),
            'image_path': frame.image_path,
            'pose_data': persons
        })
    
    return render_template('analyze.html', video=video, frames=frame_data, zones=zones)