import os
from flask import Flask
from flask_cors import CORS
from db.database import init_db, create_all_tables
from db.utils import ensure_upload_directory

# Import blueprints
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.admin_students import admin_students_bp
from routes.course import course_bp
from routes.module import module_bp
from routes.lesson import lesson_bp
from routes.student import student_bp
from routes.file_manager import file_manager_bp
from routes.settings import settings_bp
from routes.misc import misc_bp
from routes.dashboard import dashboard_bp
from routes.courses import courses_bp

# Import existing blueprints
from promote import promote
from showcase import showcase
from faq import faq
from faq_ai import faq_ai
from chatbot import chatbot
from transcript import transcript
from webhook import webhook


def create_app():
    """Application factory pattern"""
    app = Flask(__name__)

    # CORS — allow frontend dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize database
    init_db(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(admin_students_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(module_bp)
    app.register_blueprint(lesson_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(file_manager_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(misc_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(courses_bp)

    # Register existing blueprints
    app.register_blueprint(webhook)
    app.register_blueprint(promote)
    app.register_blueprint(showcase)
    app.register_blueprint(faq)
    app.register_blueprint(faq_ai)
    app.register_blueprint(chatbot)
    app.register_blueprint(transcript)

    # Ensure upload directory exists
    with app.app_context():
        ensure_upload_directory()
        create_all_tables(app)

    return app


# Create app instance for Gunicorn
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=3000)
