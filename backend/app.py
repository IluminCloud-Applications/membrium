import os
from flask import Flask, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_cors import CORS
from db.database import init_db, create_all_tables, run_migrations
from db.utils import ensure_upload_directory
from services.event_scheduler import start_scheduler
from extensions import limiter

# Import blueprints
from routes.auth import auth_bp
from routes.students import students_bp
from routes.files import files_bp
from routes.settings import settings_bp
from routes.dashboard import dashboard_bp
from routes.courses import courses_bp
from routes.course_modification import course_modification_bp
from routes.showcase import showcase_bp
from routes.promote import promote_bp
from routes.events import events_bp
from routes.faq import faq_bp
from routes.chatbot import chatbot_bp
from routes.transcripts import transcripts_bp
from routes.unsubscribe import unsubscribe_bp
from routes.member import member_bp
from webhook import webhook_bp
from routes.youtube import youtube_bp
from routes.customization import customization_bp
from routes.admin_users import admin_users_root_bp
from routes.combos import combos_bp
from routes.tracking import tracking_bp
from routes.external_api import external_api_bp


def create_app():
    """Application factory pattern"""
    app = Flask(__name__)

    # IP real do cliente atrás de proxies (Nginx do contêiner + Traefik, se houver).
    # TRUSTED_PROXY_HOPS = quantidade de proxies que confiamos (padrão 1 = só o Nginx).
    hops = int(os.environ.get('TRUSTED_PROXY_HOPS', '1'))
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=hops)

    limiter.init_app(app)

    @app.errorhandler(429)
    def too_many_requests(_e):
        return jsonify({
            'success': False,
            'message': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        }), 429

    # CORS — allow frontend dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Allow large video uploads (up to 2 GB) for the R2 proxy endpoint
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024 * 1024  # 2 GB

    # Initialize database
    init_db(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(course_modification_bp)
    app.register_blueprint(showcase_bp)
    app.register_blueprint(promote_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(faq_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(transcripts_bp)
    app.register_blueprint(unsubscribe_bp)
    app.register_blueprint(member_bp)
    app.register_blueprint(webhook_bp)
    app.register_blueprint(youtube_bp)
    app.register_blueprint(customization_bp)
    app.register_blueprint(admin_users_root_bp)
    app.register_blueprint(combos_bp)
    app.register_blueprint(tracking_bp)
    app.register_blueprint(external_api_bp)


    # Ensure upload directory exists
    with app.app_context():
        ensure_upload_directory()
        create_all_tables(app)
        run_migrations(app)
        start_scheduler(app)

    return app


# Create app instance for Gunicorn
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=3000)
