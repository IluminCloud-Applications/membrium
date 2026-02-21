import re
from models import Settings, db


def format_description(description):
    """Formata descrição de texto simples para HTML."""
    if description and ('<p>' in description.lower() or '<a' in description.lower() or '<br' in description.lower() or 
                      '<strong>' in description.lower() or '<em>' in description.lower()):
        return description
    
    url_pattern = r'https?://\S+'
    description = re.sub(url_pattern, lambda m: f'<a href="{m.group(0)}" target="_blank" class="text-blue-400 hover:underline">{m.group(0)}</a>', description)
    
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

def update_user_settings(admin, email=None, current_password=None, new_password=None):
    """Update admin user settings"""
    updated = False
    message = "Nenhuma alteração realizada."
    
    if email and email != admin.email:
        admin.email = email
        updated = True
        message = "Email atualizado com sucesso."
    
    if current_password and new_password:
        if admin.check_password(current_password):
            admin.set_password(new_password)
            updated = True
            message = "Informações atualizadas com sucesso."
        else:
            return False, "Senha atual incorreta."
    
    if updated:
        db.session.commit()
        
    return updated, message