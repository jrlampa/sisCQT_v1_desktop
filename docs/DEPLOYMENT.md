# Deploy (Cloud Run / Azure App Service)

## Objetivo

- **Single container** servindo:
  - SPA (build Vite) em `dist/client`
  - API (Express) em `dist/server`
- Porta: `PORT` (padrão `8080`)

## Segredos/variáveis

- **Nunca** versione `.env` com segredos.
- Para DEV com Docker Compose, use `.env` (copie de `\.env.example`).
- Lista completa e checklist de release: [RELEASE.md](RELEASE.md) e [.env.example](../.env.example) (secção Produção).

## Scripts (package.json)

- **Build completo**: `npm run build`
  - `build:client` → `dist/client`
  - `build:server` → `dist/server`
- **Start produção**: `npm run start:prod` (equivalente a `node dist/server/server.js`)
- **Start produção + migrations**: `npm run start:prod:migrate`
- **Aplicar migrations**: `npm run migrate:deploy`

## Dockerfile (multi-stage)

O `Dockerfile` possui targets:

- **`dev`**: para hot reload (usado no `docker-compose.yml`)
- **`prod`**: para produção (Cloud Run / Azure App Service)

Build da imagem prod:

```bash
docker build -t siscqt:prod --target prod .
```

Rodar localmente (prod):

```bash
docker run --rm -p 8080:8080 ^
  -e NODE_ENV=production ^
  -e PORT=8080 ^
  -e DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB" ^
  -e MSAL_JWKS_URI="..." ^
  -e MSAL_AUDIENCE="..." ^
  -e MSAL_ISSUER="..." ^
  siscqt:prod
```

## Migrations no startup

O `CMD` da imagem prod aceita:

- `RUN_MIGRATIONS=true` → roda `npm run migrate:deploy` antes de iniciar o server

Exemplo:

```bash
docker run --rm -p 8080:8080 ^
  -e NODE_ENV=production ^
  -e RUN_MIGRATIONS=true ^
  -e DATABASE_URL="postgresql://..." ^
  -e MSAL_JWKS_URI="..." ^
  -e MSAL_AUDIENCE="..." ^
  -e MSAL_ISSUER="..." ^
  siscqt:prod
```

## Cloud Run

- Configure variáveis de ambiente (Auth + DB).
- Configure **health check** apontando para `GET /api/healthz`.
- Para readiness, use `GET /api/readyz`.

## Deploy reproduzível (Cloud Build / GitHub Actions)

### Cloud Build ([cloudbuild.yaml](../cloudbuild.yaml))

- Build da imagem `prod` e push para Artifact Registry.
- **Deploy no Cloud Run**: por padrão `_DEPLOY=false`. Para deploy automático, crie um trigger no Cloud Console e defina a substitution `_DEPLOY=true`.
- `_REGION`, `_SERVICE`, `_AR_REPO`, `_IMAGE_NAME` são configuráveis via substitutions.

### GitHub Actions ([google-cloudrun-docker.yml](../.github/workflows/google-cloudrun-docker.yml))

- Trigger manual (`workflow_dispatch`).
- Requer **Workload Identity Federation** e os **secrets**:
  - `GCP_WORKLOAD_IDENTITY_PROVIDER`
  - `GCP_PROJECT_ID`
  - `GCP_REGION`
  - `GCP_SERVICE`
- Ver cabeçalho do workflow e [RELEASE.md](RELEASE.md) § 6.

### Banco em produção

- Garantir **PostGIS** no banco (`readyz` verifica).
- Usar `RUN_MIGRATIONS=true` no startup do container para aplicar `prisma migrate deploy`.

## Azure App Service (container)

- Configure `PORT=8080` (ou a porta exigida pelo ambiente).
- Configure variáveis de ambiente (Auth + DB).
- Use `GET /api/healthz` e `GET /api/readyz` para monitoramento.
