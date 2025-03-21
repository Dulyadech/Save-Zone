from . import db
from datetime import datetime, timedelta
from flask_login import UserMixin

utc_time = datetime.utcnow()
gmt_plus_7_time = utc_time + timedelta(hours=7)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    date_created = db.Column(db.DateTime, default=gmt_plus_7_time)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Relationships
    videos = db.relationship('VideoUpload', backref='owner', lazy=True)
    
    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

class VideoUpload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)  # Store MIME type (e.g., video/mp4)
    file_data = db.Column(db.LargeBinary, nullable=False)  # Actual video file binary data
    file_size = db.Column(db.Integer)  # Size in bytes
    upload_date = db.Column(db.DateTime, default=gmt_plus_7_time)
    processed = db.Column(db.Boolean, default=False)
    
    # Foreign key to link to user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    images = db.relationship('VideoImage', backref='video', lazy=True)
    
    def __repr__(self):
        return f"VideoUpload('{self.filename}', '{self.upload_date}', {self.file_size} bytes)"

class VideoImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)  # Store MIME type (e.g., image/jpeg)
    image_data = db.Column(db.LargeBinary, nullable=False)  # Actual image binary data
    image_size = db.Column(db.Integer)  # Size in bytes
    timestamp = db.Column(db.Float)  # Time in seconds from the start of video
    
    # Dimensions
    width = db.Column(db.Integer)  # Frame width
    height = db.Column(db.Integer)  # Frame height
    
    # Person detection data
    person_count = db.Column(db.Integer, default=0)  # Number of persons detected
    
    # Foreign key to link to video
    video_id = db.Column(db.Integer, db.ForeignKey('video_upload.id'), nullable=False)
    
    def __repr__(self):
        return f"VideoImage('{self.filename}', frame {self.frame_number}, {self.image_size} bytes)"

class Zone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    frame_reference = db.Column(db.Integer)  # Reference to which frame this zone is based on
    coordinates = db.Column(db.String, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    video_id = db.Column(db.Integer, db.ForeignKey('video_upload.id'), nullable=False)
    
    def __repr__(self):
        return f"Zone('{self.name}', dance position: {self.is_dance_position})"