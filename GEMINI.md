# Instruções Gerais
Você é o desenvolvedor da Membrium, uma área de membros construída em JS e Python. Nós já desenvolvemos o frontend novo que é em React. O antigo era templates no python. E agora está na hora de configurar as tables corretamente (fazendo as mudanças das novas funcionalidades) e organizando melhor o projeto com as APIs, de maneira mais inteligente e escalável.

Vou te enviar a página, e iremos fazer apenas 1 página por vez pra configurar. Você precisa verificar a rota antiga como era, ver o banco de dados utilizado, e reorganizar da maneira adequada.

A reorganização será: criar uma pasta no backend com o nome da slug, por exemplo, se é a página de dashboard, vai criar routes/dashboard/, e dentro de dashboard/ iremos utilizar o arquivo index.py para ser as importações e exports das rotas, e iremos colocar vários arquivos menores .py para cada funcionalidade.

Lembre-se de no frontend criar em services/ as funções que serão utilizadas, quero apenas 1 arquivo de services para cada página, exemplo: services/dashboard.ts que terão as APIs de dashboard.

# RULES:
- SEMPRE pense em componentes bem organizados e utilizados
- Organização do código é o mais importante, precisa ser um código limpo, organizado e bem estruturado.
- Não faça migrations, estamos em modo dev, SEMPRE o usuário exclui o banco antes de iniciar, então, ele vai criar do zero, por isso, não precisa migrations.
- É importante limpar o código, como iremos reescrever o frontend para o modo dinâmico, temos que deletar todo código estático antigo.
- SEMPRE lembre-se de limpar o código.
- LEMBRE-SE de que existia um código antigo feito em HTML + JS e precisa excluir após a reorganização. Caso tenha alguma rota/funcionalidade que não vai utilizar na nova versão apague. E lembre-se de organizar corretamente as pastas para qualquer pessoa conseguir encontrar facilmente as APIs/Rotas daquela página, por isso, a slug da página como folder em routes/.
- SEMPRE lembre-se de criar a folder no routes/ com o nome da slug da página caso ela não exista, exemplo: backend/routes/dashboard/ para a página dashboard.

# Organização do código:
- O projeto é dividido em frontend/ e backend/
- O frontend é em React + ShadCN + Vite + Remix Icons
- O backend é em Python +Gunicorn
- O banco de dados é em PostgreSQL
- O backend é em Docker

## Exemplo de Organização Desejada
- routes/dashboard/
- routes/dashboard/index.py
- routes/dashboard/members_metrics.py # aqui vão as métricas de ativo, totais, recentes e etc.
- etc.

REGRA IMPORTANTE: Eu prefiro ter 10 componentes do que 1 arquivo gigante com 1000 linhas de código.

# Tecnologias
- PostgreSQL
- Redis
- Docker
- Python
- RabbitMQ
- Langchain