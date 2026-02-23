# Build and Push Images to GHCR

Certifique-se de estar na raiz do projeto.
Você já deve estar logado no GHCR (`echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin` ou similar).

## App Unificado (Backend + Frontend)

### Build
```bash
docker build -t ghcr.io/iluminapp/membrium:latest -t ghcr.io/iluminapp/membrium:v2.1.1 .
```

### Push
```bash
docker push ghcr.io/iluminapp/membrium:latest
docker push ghcr.io/iluminapp/membrium:v2.1.1
```