import os
import logging
from datetime import timedelta
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger('app')

# Initialize SQLAlchemy
db = SQLAlchemy()


def init_db(app):
    """Initialize database with Flask app"""
    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        logger.warning(
            "⚠️  SECRET_KEY not set! Using insecure fallback. "
            "Set SECRET_KEY environment variable in production."
        )
        secret_key = 'dev-insecure-fallback-set-SECRET_KEY-env'
    app.config['SECRET_KEY'] = secret_key
    
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


def run_migrations(app):
    """Auto-run all .sql migration files from db/migrations/ in alphabetical order.

    Each file has comment lines stripped first, then is split on semicolons and
    executed statement by statement. Statements that fail (e.g. column already
    exists) are caught and logged as warnings so they never crash the app on
    subsequent boots.
    """
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    if not os.path.isdir(migrations_dir):
        logger.warning(f"Migrations directory not found: {migrations_dir}")
        return

    sql_files = sorted(
        f for f in os.listdir(migrations_dir) if f.endswith('.sql')
    )

    if not sql_files:
        logger.info("[migration] No migration files found.")
        return

    logger.info(f"[migration] Running {len(sql_files)} migration file(s): {sql_files}")

    try:
        conn = db.engine.raw_connection()
        try:
            cursor = conn.cursor()
            for filename in sql_files:
                filepath = os.path.join(migrations_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    sql_content = f.read()

                # Strip comment-only lines first, THEN split on semicolons.
                # Filtering after split would incorrectly discard blocks that start
                # with comments but contain real SQL before the semicolon.
                clean_lines = [
                    line for line in sql_content.splitlines()
                    if not line.strip().startswith('--')
                ]
                clean_sql = '\n'.join(clean_lines)

                statements = [
                    stmt.strip()
                    for stmt in clean_sql.split(';')
                    if stmt.strip()
                ]

                applied = 0
                for stmt in statements:
                    try:
                        cursor.execute(stmt)
                        conn.commit()
                        applied += 1
                    except Exception as e:
                        conn.rollback()
                        logger.warning(
                            f"[migration] {filename}: skipped statement "
                            f"({type(e).__name__}: {e})"
                        )

                logger.info(
                    f"[migration] {filename}: {applied}/{len(statements)} statement(s) applied."
                )
            cursor.close()
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"[migration] Fatal error in run_migrations: {e}", exc_info=True)

