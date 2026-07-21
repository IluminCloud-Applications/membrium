import sys
import os

# Ajusta o path caso seja executado de fora do diretório backend
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from app import create_app
    from models import Admin
    from db.database import db
    app = create_app()
except Exception as e:
    print(f"❌ ERRO ao carregar o aplicativo Flask: {e}")
    sys.exit(1)

email_target = "acessos@hydramarkers.com"
senha_target = "Hydra@01."

with app.app_context():
    print(f"Conectando ao banco de dados para redefinir/criar o admin {email_target}...")
    try:
        # Busca se o usuário com este e-mail já existe
        admin = Admin.query.filter_by(email=email_target).first()
        
        if admin:
            print(f"ℹ️  Usuário {email_target} encontrado. Atualizando senha...")
            admin.set_password(senha_target)
            db.session.commit()
            print(f"✅ Senha do administrador {email_target} atualizada com sucesso!")
        else:
            print(f"ℹ️  Usuário {email_target} não encontrado. Criando um novo administrador...")
            
            # Tenta herdar a 'platform_name' de algum admin existente para manter o padrão
            existing_admin = Admin.query.first()
            platform_name = existing_admin.platform_name if existing_admin else "Membrium WL"
            
            new_admin = Admin(
                email=email_target,
                platform_name=platform_name,
                is_installed=True,
                role='admin'
            )
            new_admin.set_password(senha_target)
            db.session.add(new_admin)
            db.session.commit()
            print(f"✅ Novo administrador {email_target} criado e senha definida com sucesso!")
            
    except Exception as e:
        db.session.rollback()
        print(f"❌ ERRO ao salvar alterações no banco de dados: {e}")
        sys.exit(1)
