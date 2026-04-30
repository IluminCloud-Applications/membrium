<div align="center">
  <!-- Substitua pelo link da imagem do banner/logo do App -->
  <img src="https://via.placeholder.com/800x200?text=Membrium+Banner" alt="Membrium Banner" />

  <h1>Membrium</h1>
  <p>Uma área de membros premium para infoprodutores no estilo Netflix. Solução open source elegante e de alta conversão para o seu negócio digital.</p>

  <p>
    <a href="#-instalação-em-1-clique-recomendado"><b>Deploy Automático</b></a> •
    <a href="#-tutorial-de-instalação"><b>Vídeo Tutorial</b></a> •
    <a href="#-instalação-manual-avançado"><b>Instalação Manual</b></a> •
    <a href="#-licença"><b>Licença</b></a>
  </p>
</div>

---

## Sobre o Projeto

O **Membrium** é uma área de membros inovadora construída para infoprodutores que desejam oferecer a melhor experiência para seus alunos. Inspirada no estilo Netflix, o Membrium oferece uma interface moderna, fluída e extremamente otimizada, garantindo retenção, engajamento e alta percepção de valor para seus cursos. Tudo isso mantendo o controle absoluto sobre sua operação e dados, sem taxas de terceiros.

### Principais Recursos
- **Alunos e Cursos Ilimitados:** Escale sua operação sem amarras. Hospede o app e não pague nenhuma mensalidade abusiva ou taxa por aluno matriculado. O controle absoluto da plataforma é seu.
- **Vídeos Híbridos (Economia Extrema):** Player nativo moderno com suporte a múltiplos provedores. Hospede gratuitamente no YouTube, utilize o **Cloudflare R2** para armazenamento premium quase sem custo, ou integre facilmente ao **VTurb**.
- **Inteligência Artificial & Chatbots:** Uma revolução para o seu suporte. Transcrição automática de vídeos e geração de resumos, descrições e FAQs com apenas um clique. Integração nativa com **OpenAI e Gemini** para Chatbots inteligentes dentro da área de membros.
- **Motor de Conversões (Upsell & Showcase):** O Membrium é feito para gerar lucro (LTV). Categorize seus cursos como *Principal, Order Bump, Upsell ou Bônus*. Utilize o recurso **Showcase (Vitrine)** para mostrar aos alunos os cursos que eles ainda não possuem e crie **Promoções Internas** interativas que convertem organicamente enquanto o aluno assiste à aula.
- **Ecossistema de Integrações Ativo:** Comunicação poderosa. Notifique alunos diretamente no WhatsApp via **Evolution API**, envie sequências de e-mails via **Brevo** e garanta a liberação imediata e automática de acessos com nossos Webhooks preparados para qualquer checkout (Kiwify, Hotmart, Yampi, PerfectPay, etc.).
- **Design Estilo Netflix & Customização:** Entregue uma experiência premium (UX/UI) construída com React e ShadCN. Ofereça opções de Layout ("Standard" ou imersivo "Netflix"), temas nativos Claro e Escuro, e tenha liberdade total para customizar a Página de Login com a identidade visual do seu negócio.
- **Gestão Veloz (Drag & Drop):** Painel administrativo incrivelmente rápido e intuitivo. Reorganize módulos e aulas facilmente apenas arrastando os itens, crie aulas em lote e acompanhe o progresso exato de cada aluno em tempo real.

---

## Instalação em 1 Clique (Recomendado)

A maneira mais rápida e segura de colocar o **Membrium** no ar. Essa opção configura automaticamente seu banco de dados, gera os certificados de segurança (SSL) e roteia o seu domínio personalizado em poucos segundos, colocando o app em ambiente de produção sem dor de cabeça.

[![Deploy to Ilumin](https://cdn.ilumin.app/static/banner-git.webp)](https://ilumin.app/?repo=ilumincloud-applications/membrium)

> **Por que recomendamos o Deploy Automático?**
> A infraestrutura em nuvem lida com a parte pesada (proxy reverso, criação de redes isoladas e renovação de certificados). Você foca apenas em usar o aplicativo, cadastrar seus alunos e escalar o seu negócio digital.

---

## Tutorial de Instalação

Preparamos um guia passo a passo em vídeo. Mostramos o aplicativo por dentro e como você pode ter a sua própria estrutura rodando em menos de 5 minutos.

[![Assista ao Tutorial](https://img.youtube.com/vi/SEU_ID_AQUI/maxresdefault.jpg)](https://youtu.be/SEU_ID_AQUI)

---

## Instalação Manual (Avançado)

Se você tem experiência com infraestrutura cloud, gerenciamento de servidores Linux e prefere configurar o ambiente manualmente, utilize os arquivos `docker-compose` fornecidos.

**Pré-requisitos Necessários:**
- Acesso SSH a uma VPS crua (Ubuntu/Debian).
- Docker e Docker Compose instalados no servidor.
- Conhecimento para configurar Proxy Reverso (Nginx, Traefik ou Caddy).
- Geração e renovação de certificados SSL (Let's Encrypt).

<details>
<summary><b>Opção A: docker-compose-ilumin.yml (Pronto para Ilumin Cloud / Traefik)</b></summary>

Se você usa a stack da Ilumin ou Traefik, este arquivo já vem com as labels e redes configuradas corretamente.

```yaml
services:
  membrium:
    image: ghcr.io/ilumincloud-applications/membrium:${APP_VERSION}
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/membriumwl
      - DB_PASSWORD=${DB_PASSWORD}
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - uploads_data:/app/backend/static/uploads
    networks:
      - traefik
      - internal
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.membrium.rule=Host(`${BASE_DOMAIN}`)${CUSTOM_DOMAIN:+ || Host(`${CUSTOM_DOMAIN}`)}
      - traefik.http.routers.membrium.entrypoints=websecure
      - traefik.http.routers.membrium.tls=true
      - traefik.http.routers.membrium.tls.certresolver=letsencrypt
      - traefik.http.services.membrium.loadbalancer.server.port=80
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=membriumwl
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - membrium_data:/var/lib/postgresql/data
    networks:
      - internal
    restart: unless-stopped

volumes:
  membrium_data:
  uploads_data:

networks:
  traefik:
    external: true
  internal:
```
</details>

<details>
<summary><b>Opção B: docker-compose.yml (Padrão / Quick Start)</b></summary>

Arquivo docker padrão com imagem unificada (Frontend no Nginx + Backend no Gunicorn). Ideal para testes ou atrás do seu próprio proxy reverso.

```yaml
services:
  membrium:
    image: ghcr.io/ilumincloud-applications/membrium:latest
    ports:
      - "80:80"
    environment:
      - DATABASE_URL=postgresql://postgres:Extreme123@postgres:5432/membriumwl
      - SECRET_KEY=${SECRET_KEY:-super-secret-key-change-me}
    volumes:
      - uploads_data:/app/backend/static/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_DB: membriumwl
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Extreme123
    ports:
      - "5432:5432"
    volumes:
      - membrium_data:/var/lib/postgresql/data

volumes:
  membrium_data:
  uploads_data:
```
</details>

1. Clone este repositório em seu servidor.
2. Edite as variáveis de ambiente com suas credenciais seguras.
3. Configure o bloco de servidor no Nginx apontando o seu domínio para a porta exposta.
4. Execute `docker compose up -d`.

---

## Tecnologias Utilizadas

- **Frontend:** React, Vite, ShadCN UI, Tailwind CSS, Remix Icons
- **Backend:** Python, Flask, Gunicorn
- **Banco de Dados:** PostgreSQL
- **Infraestrutura:** Docker, Docker Compose

---

## Licença

Este projeto é de código aberto e está licenciado sob a [MIT License](LICENSE.md). É 100% gratuito para uso comercial e pessoal. Você tem total liberdade para usar e modificar.

---

<div align="center">
  <br>
  <p>Made with love by <a href="https://ilumin.app">Ilumin Cloud</a></p>
  <p><a href="https://instagram.com/ilumin.app">@ilumin.app</a></p>
  <p><small>© 2026 Ilumin Cloud. Simplificando a infraestrutura para criadores e empreendedores.</small></p>
</div>