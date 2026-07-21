import sys
import os

# Ajusta o path interno
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from app import create_app
    from models import Customization
    from db.database import db
    from cache import invalidate_login_page
    app = create_app()
except Exception as e:
    print(f"❌ ERRO ao carregar o aplicativo Flask: {e}")
    sys.exit(1)

with app.app_context():
    print("Conectando ao banco de dados para alterar layout de login...")
    try:
        custom = Customization.query.first()
        if not custom:
            print("⚠️ Nenhuma customização (Customization) encontrada no banco de dados.")
        else:
            login_config = custom.login_page or {}
            old_layout = login_config.get('layout')
            
            print(f"ℹ️  Layout atual no banco de dados: '{old_layout}'")
            
            if old_layout == 'html':
                print("Alterando layout de 'html' para 'simple' (padrão seguro da plataforma)...")
                login_config['layout'] = 'simple'
                custom.login_page = login_config
                
                # Força o SQLAlchemy a registrar a alteração do JSONB
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(custom, 'login_page')
                
                db.session.commit()
                
                # Invalida o cache
                try:
                    invalidate_login_page()
                    print("✅ Cache limpo.")
                except Exception as cache_err:
                    print(f"⚠️ Aviso ao limpar cache: {cache_err}")
                    
                print("✅ Layout alterado com sucesso no banco de dados!")
                print("Agora a página de login utilizará o formulário clássico de e-mail e senha.")
            else:
                print(f"ℹ️  O layout já está configurado como '{old_layout}'. Nenhuma alteração foi necessária.")
                
    except Exception as e:
        print(f"❌ ERRO ao alterar layout: {e}")
        sys.exit(1)
