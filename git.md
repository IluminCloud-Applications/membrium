# MEMBRIUM

Área de Membros para cursos online.

## Push com Tag (deploy com versão)

```bash
git add -A
git commit -m "v1.0.0 - init"
git tag v1.0.0
git push
git push origin v1.0.0
```

> A tag define a versão da imagem Docker (ex: `v2.3.0` → imagem `2.3.0` + `latest`).


## Push simples (sem nova versão)

```bash
git add -A
git commit -m "ajuste"
git push
```


## Push Inicial

```bash
git add -A
git commit -m "v1.0.0"
git branch -M main
git push -u origin main
git tag v1.0.0
git push origin v1.0.0
```

