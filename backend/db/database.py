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
        raw_url = raw_url.replace(f":{db_password}@", f":{encoded_password}@", 1)

    # Normalize PostgreSQL URL scheme and driver compatibility
    if raw_url.startswith('postgres://'):
        raw_url = raw_url.replace('postgres://', 'postgresql://', 1)

    if raw_url.startswith('postgresql+psycopg://'):
        try:
            import psycopg
        except ImportError:
            raw_url = raw_url.replace('postgresql+psycopg://', 'postgresql+psycopg2://', 1)
    elif raw_url.startswith('postgresql://'):
        try:
            import psycopg2
            raw_url = raw_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        except ImportError:
            try:
                import psycopg
                raw_url = raw_url.replace('postgresql://', 'postgresql+psycopg://', 1)
            except ImportError:
                pass

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


def _split_sql_statements(sql_content):
    """Split SQL into individual statements, honoring DO $$ ... $$ dollar-quoted blocks."""
    statements = []
    current_lines = []
    in_dollar_quote = False

    for line in sql_content.splitlines():
        trimmed = line.strip()
        if not in_dollar_quote and trimmed.startswith('--'):
            continue

        # Count occurrences of '$$' on this line to track entering/leaving dollar quotes
        dollar_count = line.count('$$')
        if dollar_count % 2 != 0:
            in_dollar_quote = not in_dollar_quote

        if not in_dollar_quote and ';' in line:
            parts = line.split(';')
            for i, part in enumerate(parts):
                current_lines.append(part)
                if i < len(parts) - 1:
                    stmt = '\n'.join(current_lines).strip()
                    if stmt:
                        statements.append(stmt)
                    current_lines = []
        else:
            current_lines.append(line)

    remainder = '\n'.join(current_lines).strip()
    if remainder:
        statements.append(remainder)

    return statements


def _ensure_core_primary_keys(cursor, conn):
    """Garante que as tabelas base (student, course, admin, etc.) possuam Primary Key.

    Em instalações antigas ou restaurações de backup, tabelas como 'student'
    e 'course' podem perder constraints de PRIMARY KEY, o que impede a criação de
    tabelas filhas com FOREIGN KEYs.
    """
    try:
        # Limpar duplicatas em student_courses caso existam, para poder criar PK
        cursor.execute("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_courses') THEN
                    DELETE FROM student_courses a USING student_courses b 
                    WHERE a.ctid < b.ctid AND a.student_id = b.student_id AND a.course_id = b.course_id;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_courses_pkey') THEN
                        ALTER TABLE student_courses ADD PRIMARY KEY (student_id, course_id);
                    END IF;
                END IF;
            END $$;
        """)
        conn.commit()

        # Adicionar Primary Key às tabelas essenciais se ausente
        core_tables = ['student', 'course', 'admin', 'document', 'module', 'promotion', 'integration_config', 'customization']
        for table in core_tables:
            cursor.execute(f"""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table}') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{table}_pkey') THEN
                            ALTER TABLE {table} ADD PRIMARY KEY (id);
                        END IF;
                    END IF;
                END $$;
            """)
            conn.commit()
    except Exception as e:
        conn.rollback()
        logger.warning(f"[migration] _ensure_core_primary_keys warning: {e}")


def run_migrations(app):
    """Auto-run all .sql migration files from db/migrations/ in alphabetical order.

    Each file is split on semicolons (preserving DO $$ blocks) and executed
    statement by statement. Statements that fail (e.g. column already exists)
    are caught and logged as warnings so they never crash the app on subsequent boots.
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

    with app.app_context():
        try:
            conn = db.engine.raw_connection()
            try:
                cursor = conn.cursor()
                _ensure_core_primary_keys(cursor, conn)

                for filename in sql_files:
                    filepath = os.path.join(migrations_dir, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        sql_content = f.read()

                    statements = _split_sql_statements(sql_content)

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


