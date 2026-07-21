# Instruções para Servidor de Produção (Membrium) — RECOMEÇANDO DO ZERO

Esta é a guia centralizada para rodar no novo servidor de produção correto. Execute as etapas abaixo em sequência.

---

## 🚀 PASSO 0: Identificar o Contêiner
No terminal do servidor de produção, descubra o nome exato do contêiner da aplicação:
```bash
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
```
*(Substitua `<NOME_DO_CONTAINER>` nos comandos abaixo pelo nome do contêiner ativo encontrado, ex: `membriumwl-membrium-1`)*.

---

## 🔎 PASSO 1: Verificar Administradores Existentes

### Script de Verificação (`check_users.py`)
Crie o arquivo `check_users.py` no servidor com o código abaixo:

```python
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from app import create_app
    from models import Admin, Student
    from db.database import db
    app = create_app()
except Exception as e:
    print(f"\n❌ ERRO ao carregar o aplicativo Flask: {e}")
    sys.exit(1)

with app.app_context():
    try:
        db.session.execute(db.text("SELECT 1"))
        print("✅ Conexão com o banco de dados estabelecida com sucesso.")
    except Exception as e:
        print(f"\n❌ ERRO de conexão com o banco de dados: {e}")
        sys.exit(1)

    try:
        admins = Admin.query.all()
        if not admins:
            print("⚠️  Nenhum usuário administrador cadastrado no banco de dados.")
        else:
            print(f"✅ Encontrado(s) {len(admins)} administrador(es):")
            print("-" * 80)
            print(f"{'ID':<5} | {'Nome':<20} | {'E-mail':<35} | {'Cargo':<12}")
            print("-" * 80)
            for admin in admins:
                name = admin.name if admin.name else "Sem Nome"
                print(f"{admin.id:<5} | {name:<20} | {admin.email:<35} | {admin.role:<12}")
                pw_hash = admin.password
                if not pw_hash:
                    print(f"   ⚠️  AVISO: O administrador {admin.email} está SEM SENHA definida!")
                elif not (pw_hash.startswith("scrypt:") or pw_hash.startswith("pbkdf2:") or pw_hash.startswith("sha256:")):
                    print(f"   ⚠️  AVISO: O hash da senha do administrador {admin.email} parece inválido ou em texto plano!")
            print("-" * 80)
    except Exception as e:
        print(f"\n❌ ERRO ao buscar administradores: {e}")
```

### Comando para rodar no servidor:
```bash
docker exec -i <NOME_DO_CONTAINER> python < check_users.py
```

---

## 🛠️ PASSO 2: Forçar Layout de Login Tradicional ("simple")
Se a página estiver com Acesso Rápido ou layout customizado quebrado, use este script para forçar a exibição clássica dos campos de e-mail e senha.

### Script de Alteração (`force_simple_layout.py`)
```python
import sys
import os

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
            
            print(f"ℹ️ Layout atual no banco de dados: '{old_layout}'")
            
            # Altera para o clássico
            login_config['layout'] = 'simple'
            login_config['quick_access_enabled'] = False
            custom.login_page = login_config
            
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(custom, 'login_page')
            db.session.commit()
            
            try:
                invalidate_login_page()
                print("✅ Cache limpo.")
            except Exception as cache_err:
                print(f"⚠️ Aviso ao limpar cache: {cache_err}")
                
            print("✅ Layout alterado com sucesso no banco de dados!")
            print("Agora a página de login utilizará o formulário clássico de e-mail e senha.")
    except Exception as e:
        print(f"❌ ERRO ao alterar layout: {e}")
        sys.exit(1)
```

### Comando para rodar no servidor:
```bash
docker exec -i <NOME_DO_CONTAINER> python < force_simple_layout.py
```

---

## 🧹 PASSO 3: Limpar o Cache do Redis (Importante)
Para que o site do cliente reflita a mudança de layout imediatamente, limpe o cache do contêiner Redis:
```bash
docker exec -i membriumwl-redis-1 redis-cli FLUSHALL
```
*(Caso o contêiner do Redis tenha outro nome, ajuste no comando acima)*.

---

## 🔑 PASSO 4: Redefinir ou Criar o Administrador
Utilize este script para redefinir as credenciais do admin principal (`acessos@hydramarkers.com` para a senha `Hydra@01.`).

### Script de Alteração (`reset_admin.py`)
```python
import sys
import os

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
        admin = Admin.query.filter_by(email=email_target).first()
        
        if admin:
            print(f"ℹ️ Usuário {email_target} encontrado. Atualizando senha...")
            admin.set_password(senha_target)
            db.session.commit()
            print(f"✅ Senha do administrador {email_target} atualizada com sucesso!")
        else:
            print(f"ℹ️ Usuário {email_target} não encontrado. Criando um novo administrador...")
            
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
```

### Comando para rodar no servidor:
```bash
docker exec -i <NOME_DO_CONTAINER> python < reset_admin.py
```

---

## 🗑️ PASSO 5: Limpeza Final
Remova os scripts temporários criados no servidor:
```bash
rm check_users.py force_simple_layout.py reset_admin.py
```
