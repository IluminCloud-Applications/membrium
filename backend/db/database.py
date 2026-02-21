import os
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()


def init_db(app):
    """Initialize database with Flask app"""
    # Use a fixed secret key from env for session persistence across Gunicorn workers
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    return db


def create_all_tables(app):
    """Create all database tables.
    
    Wrapped in try/except to handle race conditions when multiple
    Gunicorn workers try to create tables concurrently.
    """
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            # Multiple workers may race to create tables simultaneously.
            # If a table was already created by another worker, just ignore.
            import logging
            logging.getLogger('app').warning(
                f"create_all_tables warning (likely race condition): {e}"
            )

