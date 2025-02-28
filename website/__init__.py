from flask import Flask

def create_app():
    app = Flask(__name__)
    from .views import UPLOAD_FOLDER, OUTPUT_FOLDER
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
    app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov'}

    from.views import views

    app.register_blueprint(views, url_prefix='/')

    return app