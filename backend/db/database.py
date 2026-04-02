import os
from datetime import timedelta
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()


def init_db(app):
    """Initialize database with Flask app"""
    # Use a fixed secret key from env for session persistence across Gunicorn workers
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))
    
    raw_url = os.environ.get('DATABASE_URL', '')
    db_password = os.environ.get('DB_PASSWORD')
    
    if db_password and raw_url:
        import urllib.parse
        encoded_password = urllib.parse.quote_plus(db_password)
        safe_url = raw_url.replace(f":{db_password}@", f":{encoded_password}@", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = safe_url
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = raw_url

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Session cookie configuration — 30 days persistence
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

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

