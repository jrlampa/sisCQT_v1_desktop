# sisCQT Enterprise AI — Engenharia de Redes BT

O **sisCQT Enterprise AI** é uma plataforma avançada de engenharia elétrica dedicada ao projeto, simulação e dimensionamento de redes de distribuição de Baixa Tensão (BT). Desenvolvido com uma interface **Glassmorphism Light**, o sistema une precisão normativa com uma experiência de usuário fluida e moderna.

## 🚀 Funcionalidades Principais

- **Hub de Projetos**: Gestão centralizada de estudos de rede com suporte a clonagem, edição de metadados geotécnicos (SOB, Ponto Elétrico, Coordenadas) e controle de versões.
- **Motor de Cálculo Theseus 3.1**: Algoritmo proprietário para cálculo de fluxo de carga, queda de tensão acumulada (CQT) e ocupação de transformadores baseado nas normas PRODIST e ABNT.
- **Editor de Topologia em Cascata**: Interface dinâmica para construção de redes, permitindo o controle individual de trechos, tipos de condutores e cargas (Residenciais, Especiais e IP).
- **Matriz de Comparação de Cenários**: Análise técnica lado a lado para validação de alternativas (ex: "Rede Atual" vs "Projeto de Reforço").
- **Theseus AI (Cognitivo)**: Assistente de engenharia integrado que analisa pontos críticos de sobrecarga e sugere otimizações baseadas em melhor custo-benefício.
- **Diagrama Unifilar Interativo**: Visualização gráfica da árvore de rede com indicadores de saúde térmica e níveis de tensão em tempo real.
- **Memorial Descritivo Automatizado**: Geração de relatório técnico completo, pronto para impressão, com justificativas, quadros de cargas e resumo de materiais.

## 🛠️ Stack Técnica

- **Frontend**: React (TypeScript) + Vite.
- **Estilização**: Tailwind CSS com efeitos de Glassmorphism (blur, transparência e camadas).
- **Gráficos**: Recharts para diagnóstico de carregamento.
- **Motor Cognitivo**: Gemini API (Integration via `GeminiService`).
- **Engenharia**: Lógica de cálculo em TypeScript (ElectricalEngine) com suporte a fatores de diversidade (DMDI).
- **Backend**: Express 5 + Prisma (Postgres/PostGIS).
- **Desktop**: Electron (empacotado via `electron-builder`).

## 🖥️ Rodando como Desktop (Electron)

Este repo (`sisCQT_v1_desktop`) inclui um scaffold inicial para rodar a UI em um container Electron.

### Configuração (.env)

- Copie `.env.example` para `.env` e ajuste os valores conforme o cenário.
- **Desktop com backend remoto (recomendado)**:
  - Defina `VITE_API_BASE_URL` (ex.: `https://api.suaempresa.com`) **antes do build**.
  - Garanta CORS no backend remoto com `ALLOWED_ORIGINS` incluindo `http://127.0.0.1:28765,http://localhost:28765`.
- **Dev local (tudo local)**:
  - Pode deixar `VITE_API_BASE_URL` vazio (o frontend usa `"/api"`).
  - Para o backend e banco, configure `DATABASE_URL`/`DIRECT_URL` (ver `.env.example`).

### Pré-requisitos

- Node.js LTS

### Dev (desktop)

```bash
npm install
npm run dev:desktop
```

O comando acima sobe:

- Vite (renderer) em `http://127.0.0.1:3000`
- API (Express) em `http://127.0.0.1:8080`
- Electron apontando para o Vite

### Build (desktop)

```bash
npm run build:desktop
```

O build gera os artefatos em `dist/desktop/` (instalador NSIS no Windows). Por padrão o instalador **não é assinado**; o Windows pode exibir avisos do SmartScreen. Para assinatura de código, ver [docs/RELEASE.md](docs/RELEASE.md).

### OAuth (Entra ID + Google) no Desktop

O frontend usa:

- **Microsoft Entra ID** via MSAL (`authConfig.ts`). Atenção: o `redirectUri` precisa apontar para a **origem real** do app (host + porta), especialmente no Desktop empacotado.
- **Google** via `@react-oauth/google` (GIS) usando a **origem** atual do app

Isso significa que, para funcionar no Desktop, você precisa **cadastrar no provedor a origem/Redirect URI que o app realmente abre** (host + porta).

- **Dev (Vite)**: `http://127.0.0.1:3000` (ou `http://localhost:3000`)
- **Desktop empacotado (recomendado: porta fixa)**: `http://localhost:28765` e `http://127.0.0.1:28765`

Checklist de configuração:

- **Entra ID (App Registration)**:
  - Authentication → Add a platform → **Single-page application (SPA)**
  - Adicione as **Redirect URIs** acima (dev e desktop)
- **Google Cloud (OAuth Client ID)**:
  - Em Credentials → OAuth 2.0 Client ID, adicione em **Authorized JavaScript origins** as origens acima

Variáveis de ambiente (frontend):

- `VITE_MSAL_CLIENT_ID`
- `VITE_MSAL_AUTHORITY`
- `VITE_GOOGLE_CLIENT_ID` (se vazio, o botão do Google fica desabilitado)

## 📐 Metodologia de Cálculo

A plataforma utiliza o método dos momentos de carga para determinação da queda de tensão:
$$CQT = \sum (kVA \cdot L \cdot Coef_{cabo} \cdot 0.5)$$

- **Normativas suportadas**: PRODIST (Aneel) e ABNT.
- **Perfis de Carga**: Urbano Padrão, Rural e Massivos (configuráveis por cenário).
- **DMDI**: Fator de diversidade dinâmico baseado no número de consumidores e classe de carga.

## 📁 Estrutura do Projeto

- **`src/`** — Frontend: `App`, `index`, `components/` (Dashboard, Editor, Hub, etc.), `context/`, `hooks/`, `assets/`.
- **`server/`** — Backend: `routes/`, `middlewares/`, `controllers/`, `schemas/`.
- **`services/`** — Core de engenharia e integração (motor de IA, import XLSX, etc.).
- **`tests/`** — Testes unitários e de integração; `tests/components/` para testes de componentes.
- **`e2e/`** — Testes E2E (Playwright).
- **Raiz**: `server.ts`, `types.ts`, `constants.ts`, `authConfig.ts`, configs (Vite, Prisma, etc.).

## ✅ CI / Build / Release (Desktop)

- **Testes**:
  - `npm run test:unit` (Vitest)
  - `npm run test:e2e` (Playwright)
- **Build desktop**:
  - `npm run build:desktop`
- **GitHub Actions**:
  - O workflow `CI` roda testes e valida o build do desktop.
  - Para publicar um release do instalador, crie uma tag `desktop-vX.Y.Z` (ex.: `desktop-v1.0.0`).
- **Runbook**: ver [docs/RELEASE.md](docs/RELEASE.md) para checklist, secrets e passos completos.
- **Versionamento**: SemVer (`package.json`). Tags `desktop-vX.Y.Z` (ex.: `desktop-v1.0.0`).

## ▶️ Rodando localmente (recomendado: Docker)

### Pré-requisitos (Docker)

- Docker Desktop (com suporte a Docker Compose)

### Subir app + banco (PostGIS)

1. Na raiz do projeto:

```bash
docker compose up --build
```

Observação: o `docker-compose.yml` aplica o schema via **Prisma Migrations** (`prisma migrate deploy`) antes de subir a API.

1. Acesse:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8080`

### Extensões do banco (PostGIS + pgcrypto)

O banco sobe com scripts de init em `docker/db/init/` (executados **somente no primeiro init do volume**). Se você já tinha um volume antigo, recrie o volume para aplicar:

```bash
docker compose down -v
docker compose up --build
```

### Trabalhando com migrations (Prisma)

- Para criar uma nova migration após editar `prisma/schema.prisma`, rode localmente:

```bash
npx prisma migrate dev --name "<nome-da-migration>"
```

- Em produção/containers, o fluxo esperado é aplicar migrations com:

```bash
npm run migrate:deploy
```

---
**IM3 Brasil — Engenharia Digital**  
*Transformando dados de rede em decisões de alta performance.*
