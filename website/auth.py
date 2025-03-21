from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_user, logout_user, login_required, current_user
from . import db, bcrypt
from .models import User

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('views.home'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # User validation
        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()
        
        if user_exists:
            flash('Username already exists.', 'danger')
        elif email_exists:
            flash('Email already registered.', 'danger')
        elif password != confirm_password:
            flash('Passwords do not match.', 'danger')
        elif len(password) < 6:
            flash('Password must be at least 6 characters.', 'danger')
        else:
            # Create new user
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            new_user = User(username=username, email=email, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            
            flash('Account created successfully! You can now login.', 'success')
            return redirect(url_for('auth.login'))
            
    return render_template('register.html')

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('views.home'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('views.home'))
        else:
            flash('Login unsuccessful. Please check email and password.', 'danger')
            
    return render_template('login.html')

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('views.home'))

@auth.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@auth.route('/create-admin')
def create_admin():
    username = 'admin'
    email = 'admin@savezone'
    password = 'sofiaispretty'
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    admin_user = User(username=username, email=email, password=hashed_password, is_admin=True)
    db.session.add(admin_user)
    db.session.commit()
    return 'Admin user created successfully!'

@auth.route('/admin')
@login_required
def admin():
    # Check if user is admin
    if not hasattr(current_user, 'is_admin') or not current_user.is_admin:
        flash('Access denied: Admin privileges required.', 'danger')
        return redirect(url_for('views.home'))
    
    # Get all users from the database
    users = User.query.all()
    
    

    return render_template('admin.html', users=users)