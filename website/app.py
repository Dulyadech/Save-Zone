import os
from flask import Flask, render_template, request
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'static/frames'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov'}

# เช็คว่าไฟล์ที่อัปโหลดเป็นวิดีโอหรือไม่
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# หน้าหลัก
@app.route('/')
def home():
    return render_template('index.html')

# API อัปโหลดวิดีโอ
@app.route('/upload', methods=['POST','GET'])
def upload_video():
    if request.method == 'POST':
        if 'video' not in request.files:
            return 'Error : File not upload.'

        file = request.files['video']
        if file.filename == '':
            return 'Error : File not found.'

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            return render_template('')

    return render_template('')

if __name__ == '__main__':
    app.run(debug=True)