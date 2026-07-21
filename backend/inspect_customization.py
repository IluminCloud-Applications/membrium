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
    print("Conectando ao banco de dados para inspecionar customização...")
    try:
        custom = Customization.query.first()
        if not custom:
            print("⚠️ Nenhuma customização (Customization) encontrada no banco de dados.")
        else:
            print("✅ Customização encontrada!")
            print("-" * 50)
            import json
            print("Configuração atual da página de login:")
            print(json.dumps(custom.login_page, indent=2))
            print("-" * 50)
            
            login_config = custom.login_page or {}
            
            # Se quick_access_enabled estiver True, desativa para liberar o login com senha
            if login_config.get('quick_access_enabled'):
                print("\n⚠️ O Acesso Rápido (quick_access_enabled) está ATIVADO.")
                print("Isso bloqueia o login de Administradores porque o validador só busca Alunos.")
                print("Desativando Acesso Rápido para liberar o campo de senha convencional...")
                
                login_config['quick_access_enabled'] = False
                custom.login_page = login_config
                
                # Força o SQLAlchemy a perceber a modificação no campo JSONB
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(custom, 'login_page')
                
                db.session.commit()
                
                # Invalida o cache do Flask
                try:
                    invalidate_login_page()
                    print("✅ Cache de customização limpo.")
                except Exception as cache_err:
                    print(f"⚠️ Aviso ao limpar cache: {cache_err}")
                
                print("✅ Acesso Rápido desativado com sucesso no banco de dados!")
            else:
                print("\nℹ️ O Acesso Rápido (quick_access_enabled) já está DESATIVADO.")
                print("A tela de login deve exibir os campos de E-mail e Senha normalmente.")
                
    except Exception as e:
        print(f"❌ ERRO ao inspecionar/atualizar customização: {e}")
        sys.exit(1)
