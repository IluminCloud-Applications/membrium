import sys
import os

# Ajusta o path caso seja executado de fora do diretório backend
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    print("Iniciando carregamento do app Flask...")
    from app import create_app
    from models import Admin, Student
    from db.database import db
    
    app = create_app()
    print("App Flask inicializado com sucesso.")
except Exception as e:
    print(f"\n❌ ERRO ao carregar o aplicativo Flask: {e}")
    print("Verifique se as dependências do backend estão instaladas e se as variáveis de ambiente estão corretas.")
    sys.exit(1)

with app.app_context():
    print("\nConectando ao banco de dados...")
    try:
        # Testa a conexão básica executando uma consulta simples
        db.session.execute(db.text("SELECT 1"))
        print("✅ Conexão com o banco de dados estabelecida com sucesso.")
    except Exception as e:
        print(f"\n❌ ERRO de conexão com o banco de dados: {e}")
        print("Verifique se o serviço do PostgreSQL está rodando e se a variável DATABASE_URL está correta.")
        sys.exit(1)

    print("\nBuscando usuários administradores na tabela 'admin'...")
    try:
        admins = Admin.query.all()
        if not admins:
            print("⚠️  Nenhum usuário administrador cadastrado no banco de dados.")
        else:
            print(f"✅ Encontrado(s) {len(admins)} administrador(es):")
            print("-" * 85)
            print(f"{'ID':<5} | {'Nome':<25} | {'E-mail':<35} | {'Cargo (Role)':<12}")
            print("-" * 85)
            for admin in admins:
                name = admin.name if admin.name else "Sem Nome"
                print(f"{admin.id:<5} | {name:<25} | {admin.email:<35} | {admin.role:<12}")
                # Validação rápida do formato do hash da senha
                pw_hash = admin.password
                if not pw_hash:
                    print(f"   ⚠️  AVISO: O administrador {admin.email} está SEM SENHA definida!")
                elif not (pw_hash.startswith("scrypt:") or pw_hash.startswith("pbkdf2:") or pw_hash.startswith("sha256:")):
                    print(f"   ⚠️  AVISO: O hash da senha do administrador {admin.email} parece inválido ou em texto plano!")
            print("-" * 85)
    except Exception as e:
        print(f"\n❌ ERRO ao buscar administradores: {e}")
        print("Pode ser que as tabelas não tenham sido criadas ou que a tabela 'admin' tenha uma estrutura diferente.")

    print("\nBuscando total de estudantes cadastrados...")
    try:
        student_count = Student.query.count()
        print(f"✅ Total de estudantes (alunos): {student_count}")
    except Exception as e:
        print(f"⚠️  Não foi possível contar os estudantes: {e}")

print("\nVerificação concluída.")
