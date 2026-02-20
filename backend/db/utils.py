import os
import re
from db.database import db
from models import Settings

def format_description(description):
    """Format description text with HTML tags for URLs and line breaks"""
    # Check if the description already contains HTML formatting
    if description and ('<p>' in description.lower() or '<a' in description.lower() or '<br' in description.lower() or 
                      '<strong>' in description.lower() or '<em>' in description.lower()):
        # Already formatted HTML, just return it as is
        return description
    
    # If not, apply formatting for plain text
    # Identifica URLs e as transforma em links HTML
    url_pattern = r'https?://\S+'
    description = re.sub(url_pattern, lambda m: f'<a href="{m.group(0)}" target="_blank" class="text-blue-400 hover:underline">{m.group(0)}</a>', description)
    
    # Substitui quebras de linha por tags <br>
    description = description.replace('\n', '<br>')
    
    return description

def get_or_create_settings():
    """Get existing settings or create new ones if they don't exist"""
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
        db.session.commit()
    return settings

def ensure_upload_directory():
    """Ensure that the uploads directory exists"""
    uploads_dir = 'static/uploads'
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        print(f"Diretório {uploads_dir} criado")
    return uploads_dir

def check_installation():
    """Check if the application has been installed"""
    from models import Admin
    admin = Admin.query.first()
    return admin is not None and admin.is_installed
