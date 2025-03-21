from . import db
from datetime import datetime
from flask_login import UserMixin

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Relationships
    videos = db.relationship('VideoUpload', backref='owner', lazy=True)
    zones = db.relationship('Zone', backref='creator', lazy=True)
    
    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

class VideoUpload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)  # Store MIME type (e.g., video/mp4)
    file_data = db.Column(db.LargeBinary, nullable=False)  # Actual video file binary data
    file_size = db.Column(db.Integer)  # Size in bytes
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)
    
    # Original filepath (can be used as backup reference)
    original_filepath = db.Column(db.String(255))
    
    # Foreign key to link to user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    images = db.relationship('VideoImage', backref='video', lazy=True)
    zones = db.relationship('Zone', backref='video', lazy=True)
    
    def __repr__(self):
        return f"VideoUpload('{self.filename}', '{self.upload_date}', {self.file_size} bytes)"

class VideoImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)  # Store MIME type (e.g., image/jpeg)
    image_data = db.Column(db.LargeBinary, nullable=False)  # Actual image binary data
    image_size = db.Column(db.Integer)  # Size in bytes
    frame_number = db.Column(db.Integer)
    timestamp = db.Column(db.Float)  # Time in seconds from the start of video
    
    # Original filepath (can be used as backup reference)
    original_filepath = db.Column(db.String(255))
    
    # Foreign key to link to video
    video_id = db.Column(db.Integer, db.ForeignKey('video_upload.id'), nullable=False)
    
    def __repr__(self):
        return f"VideoImage('{self.filename}', frame {self.frame_number}, {self.image_size} bytes)"

class Zone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    coordinates = db.Column(db.Text, nullable=False)  # Store as JSON string
    is_dance_position = db.Column(db.Boolean, default=True)  # Changed from is_danger_zone
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey('video_upload.id'), nullable=False)
    
    def __repr__(self):
        return f"Zone('{self.name}', dance position: {self.is_dance_position})"