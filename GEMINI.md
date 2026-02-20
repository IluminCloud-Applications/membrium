# Instruções Gerais
Você está desenvolvendo a Membrium, uma área de membros premium para infoprodutores no Estilo Netflix.

A área de membros já está construída em backend/ com templates, porém, vamos migrar ela para o frontend ser React + ShadCN + Vite + Remix Icons.

Porque estamos migrando:
1. A área de membros não tá profissional, está feia.
2. A área de membros não está moderna.
3. A área de membros não está fluída.
4. A área de membros não está otimizada.

Ou seja, a ideia é passar uma experiência melhor e mais bonita em UI/UX para o usuário utilizando React.

o frontend é em frontend/ e o backend é em backend/

É para utilizar shadcn (use a tool para obter informações dos componentes e exemplos, por exemplo, caso queira uma sidebar, use a tool pra obter a sidebar e instalar ela já pronta).

# RULES:
- Utilize ShadCN para obter os componentes prontos.
- O nosso design é vermelho e branco (light) e preto e vermelho (dark)
- Não abra navegador
- Não inicie o aplicativo (docker compose up, npm run dev e etc.)
- Utilize o Remix Icons (Instale para usar)
- SEMPRE pense em componentes bem organizados e utilizados
- Organização do código é o mais importante, precisa ser um código limpo, organizado e bem estruturado.
- Sempre pense no design dos componentes antes de criar, utilize o shadcn para obter os componentes prontos.
- Sempre veja o css e veja se tem classes prontas para usar. O ideal é manter o design global, por exemplo, o botão 1 ser x e quando eu quiser repetir ele, basta utilizar a mesma class. Assim mantém o design uniforme em todo o aplicativo.
- Não faça migrations, estamos em modo dev, SEMPRE o usuário exclui o banco antes de iniciar, então, ele vai criar do zero, por isso, não precisa migrations.

# Organização do código:
- O projeto é dividido em frontend/ e backend/
- O frontend é em React + ShadCN + Vite + Remix Icons
- O backend é em Flask
- O banco de dados é em PostgreSQL
- O projeto é em Docker
- O projeto é em Python
- O projeto é em JavaScript

## Exemplo de Organização Desejada
- frontend/
- pages/
- pages/login/ # veja que estou criando uma pasta para cada página e os componentes de index, form e etc.
- pages/dashboard/
- components/modals/login/ # veja que estou criando uma pasta em componentes para os modais, e a pasta de login para os componentes do modal de login (esqueci a senha por exemplo)

REGRA IMPORTANTE: Eu prefiro ter 10 componentes do que 1 arquivo gigante com 1000 linhas de código.

# Tecnologias
- React
- ShadCN
- Vite
- Remix Icons
- Tailwind CSS
- TypeScript
- Flask
- PostgreSQL
- Docker
