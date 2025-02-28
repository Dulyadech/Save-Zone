from flask import Blueprint, render_template, request
import os
from werkzeug.utils import secure_filename
from .processvideo import process_video

views = Blueprint('views',__name__)

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

@views.route('/upload', methods=['GET','POST'])
def upload():
    if request.method == 'POST':
        if 'video' not in request.files:
            return 'Error: No file uploaded.'

        file = request.files['video']
        if file.filename == '':
            return 'Error: No file selected.'

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            process_video(video_path=filepath, max_process_seconds=30)
            return render_template('upload.html')
    return render_template('upload.html')

@views.route('/create', methods=['GET','POST'])
def create():
    return render_template('create.html')

@views.route('/previews')
def previews():
    return render_template('preview_&_edit.html')

@views.route('/about')
def about():
    return render_template('about_us.html')