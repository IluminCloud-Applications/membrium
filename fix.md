# Solução para Erro de Personalização (Favicon / OG Type) - StaleDataError

Copie e cole os comandos abaixo diretamente no terminal do servidor do cliente (`root@Area-de-Membros-GV-Suprema:/opt/apps/membriumwl#`):

### 1. Remover registros duplicados na tabela `customization` e recriar a Primary Key:

```bash
docker exec -it membriumwl-postgres-1 psql -U postgres -d membriumwl -c "DELETE FROM customization WHERE ctid NOT IN (SELECT min(ctid) FROM customization);"
docker exec -it membriumwl-postgres-1 psql -U postgres -d membriumwl -c "ALTER TABLE customization ADD PRIMARY KEY (id);"
```

---

### 2. (Recomendado) Remover registros duplicados de outras tabelas afetadas pela restauração:

```bash
docker exec -it membriumwl-postgres-1 psql -U postgres -d membriumwl -c "
DELETE FROM admin WHERE ctid NOT IN (SELECT min(ctid) FROM admin GROUP BY email);
DELETE FROM course WHERE ctid NOT IN (SELECT min(ctid) FROM course GROUP BY id);
DELETE FROM document WHERE ctid NOT IN (SELECT min(ctid) FROM document GROUP BY id);
DELETE FROM integration_config WHERE ctid NOT IN (SELECT min(ctid) FROM integration_config GROUP BY id);
DELETE FROM lesson WHERE ctid NOT IN (SELECT min(ctid) FROM lesson GROUP BY id);
DELETE FROM module WHERE ctid NOT IN (SELECT min(ctid) FROM module GROUP BY id);
DELETE FROM promotion WHERE ctid NOT IN (SELECT min(ctid) FROM promotion GROUP BY id);
DELETE FROM student WHERE ctid NOT IN (SELECT min(ctid) FROM student GROUP BY email);
"
```

---

### 3. Reiniciar a aplicação para recarregar o cache (se necessário):

```bash
docker restart membriumwl-membrium-1
```
