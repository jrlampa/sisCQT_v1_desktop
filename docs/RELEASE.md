# Runbook de release — sisCQT Desktop

Checklist e passos para publicar um release estável do instalador Windows e da API.

## Visão geral

- **Desktop**: tag `desktop-vX.Y.Z` → workflow [release-desktop.yml](../.github/workflows/release-desktop.yml) → GitHub Release (`.exe`, `.blockmap`, `latest.yml`).
- **API**: Docker `prod` → Cloud Run / Azure (ver [DEPLOYMENT.md](DEPLOYMENT.md)).

## 1. Pré-requisitos (secrets e config)

### GitHub Actions (release desktop)

| Secret | Uso |
|--------|-----|
| `VITE_API_BASE_URL_PROD` | URL da API em produção (ex.: `https://api.suaempresa.com`). Usado no build do Electron. Se o desktop falar com API remota, **obrigatório**. |

Configurar em **Settings → Secrets and variables → Actions**.

### API (Cloud Run / Azure)

- **Auth**: `MSAL_JWKS_URI`, `MSAL_AUDIENCE`, `MSAL_ISSUER` (obrigatórios em prod). Ver [AUTH.md](AUTH.md).
- **CORS**: `ALLOWED_ORIGINS` deve incluir as origens do frontend/desktop, por exemplo:
  - `http://localhost:28765`, `http://127.0.0.1:28765` (desktop empacotado)
  - `https://app.suaempresa.com` (se houver web)
- **Database**: PostGIS habilitado; `migrate:deploy` antes do start (`RUN_MIGRATIONS=true`).

Variáveis completas em [.env.example](../.env.example) (secção Produção).

## 2. Checklist antes do release

- [ ] `npm ci && npm run test:unit && npm run test:e2e` passam localmente.
- [ ] `npm run build:desktop` conclui sem erro.
- [ ] Secret `VITE_API_BASE_URL_PROD` configurado (se desktop usar API remota).
- [ ] Versão em `package.json` alinhada com a tag que será criada (ex.: `1.0.0` → `desktop-v1.0.0`).
- [ ] `npm audit` executado; vulnerabilidades críticas/altas tratadas (`npm audit fix` quando possível).

## 3. Comandos

```bash
npm ci
npm audit
npm run test:unit
npm run test:e2e
npm run build:desktop
```

## 4. Publicar release desktop

1. Atualize a versão em `package.json` (SemVer: `X.Y.Z`). A tag será `desktop-vX.Y.Z` (ex.: `1.0.0` → `desktop-v1.0.0`).
2. Commit e push para `main`.
3. Crie e envie a tag:

   ```bash
   git tag desktop-v1.0.0
   git push origin desktop-v1.0.0
   ```

4. O workflow **Release Desktop (Windows)** irá:
   - Rodar unit + E2E
   - Fazer build do instalador
   - Criar GitHub Release e anexar os artefatos

Alternativa: **Actions → Release Desktop (Windows) → Run workflow** (usa o commit atual; tag não é obrigatória para `workflow_dispatch`, mas o release criado pode não ficar ligado a uma tag).

## 5. Assinatura do instalador Windows

Por padrão, o instalador **não é assinado** (`signAndEditExecutable: false` em `package.json`). O Windows pode exibir avisos do SmartScreen.

Para assinar:

1. Obter certificado de assinatura de código (ex.: EV).
2. Configurar variáveis do `electron-builder` (provedor, certificado) nos secrets do GitHub ou em CI.
3. Ativar `signAndEditExecutable: true` em `package.json` → `build.win`.

Documentar o processo internamente (onde o certificado fica, como rotacionar, etc.).

## 6. Deploy da API (Cloud Run / Cloud Build)

- **Cloud Build**: [cloudbuild.yaml](../cloudbuild.yaml). Por padrão `_DEPLOY=false`; para deploy automático no Cloud Run, defina `_DEPLOY=true` no trigger.
- **GitHub Actions**: [google-cloudrun-docker.yml](../.github/workflows/google-cloudrun-docker.yml). Manual (`workflow_dispatch`). Requer **Workload Identity Federation** e os secrets:
  - `GCP_WORKLOAD_IDENTITY_PROVIDER`
  - `GCP_PROJECT_ID`
  - `GCP_REGION`
  - `GCP_SERVICE`

Ver [DEPLOYMENT.md](DEPLOYMENT.md) § Deploy reproduzível.

## 7. Rollback

- **Desktop**: publicar um novo release a partir de um commit anterior (ou tag `desktop-vX.Y.Z-1`) e avisar usuários.
- **API**: redeploy da imagem Docker anterior no Cloud Run / Azure.

## 8. Notas

- **IA no release**: apenas **Gemini** (`/api/gemini/ask`) está em uso. O Chatbot chama esse endpoint. Rotas Groq/`aiRoutes` foram removidas.
- **Versionamento**: usar **SemVer** (ex.: `1.0.0`). Tags seguem `desktop-vX.Y.Z`.
