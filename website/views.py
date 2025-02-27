from flask import Blueprint, render_template

views = Blueprint('views',__name__)

@views.route('/')
def home():
    return render_template('')

@views.route('/upload', methods=['GET','POST'])
def upload():
    return render_template('')

@views.route('/creaate', methods=['GET','POST'])
def create():
    return render_template('')

@views.route('/previews')
def previews():
    return render_template('')

@views.route('/about')
def about():
    return render_template('')