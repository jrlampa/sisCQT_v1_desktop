# Plano de Testes (ISO/IEC 29119 – alinhamento prático)

## 1. Identificação

- **Produto**: sisCQT Enterprise AI (web + API + desktop)
- **Repositório**: `sisCQT_v1_desktop`
- **Versão do plano**: 1.0

## 2. Objetivo do plano

Definir **escopo, abordagem, critérios e evidências** para executar testes de forma repetível e auditável.

## 3. Itens sob teste

- SPA (React/Vite): principais telas e fluxos
- API (Express): rotas e validações
- Serviços críticos:
  - engine elétrico (`services/electricalEngine*.ts`)
  - importação XLSX (`services/xlsxImportService.ts` e correlatos)
  - autenticação/segurança (`routes/authRoutes.ts`, middlewares, utils de token)

## 4. Fora do escopo (neste ciclo)

- Testes de carga/soak/chaos (a menos que explicitamente demandados)
- Certificação formal

## 5. Abordagem e tipos de teste

- **Unit/integration**:
  - `tests/*.test.ts(x)` com Vitest
- **E2E**:
  - `e2e/*.e2e.spec.ts` com Playwright (inclui a11y e snapshots)

## 6. Ambiente de teste

- **Local**:
  - Node 20+
  - `npm ci` ou `npm install`
- **CI**:
  - Windows runner (`windows-latest`)

## 7. Dados de teste

- Preferir mocks/fixtures e seeds determinísticas.
- XLSX real:
  - **não versionar** (ver `docs/TESTING.md`)
  - testes que dependem do arquivo devem ser condicionais à sua presença.

## 8. Critérios de entrada (Entry)

- Requisitos/itens definidos com critérios de aceite (DoR atendida)
- Código compilando e lints essenciais ok
- Casos de teste identificados e rastreabilidade mínima criada/atualizada

## 9. Critérios de saída (Exit)

- `npm run test:unit` passa
- `npm run test:e2e` passa
- Evidências anexadas/armazenadas:
  - relatório Playwright e evidências de falhas (se houver)
- Incidentes registrados e triados (se houver)
- Matriz de rastreabilidade atualizada

## 10. Entregáveis (artefatos)

- Casos de teste: ver template em `docs/quality/templates/test-case-template.md`
- Registro de execução: `docs/quality/templates/test-execution-record-template.md`
- Relatório/sumário: `docs/quality/templates/test-summary-report-template.md`
- Incidentes: `docs/quality/templates/test-incident-report-template.md`
- Matriz: `docs/quality/traceability-matrix-template.md`

## 11. Comandos de execução

- Unit/integration:
  - `npm run test:unit`
- E2E:
  - `npm run test:e2e`

## 12. Riscos e mitigação (exemplos)

- **Risco**: regressão no engine/cálculos.
  - **Mitigação**: testes determinísticos + cenários normativos + revisão técnica.
- **Risco**: flakiness em E2E.
  - **Mitigação**: retries em CI, trace em primeira falha, isolamento de dados.
- **Risco**: evidências insuficientes para auditoria.
  - **Mitigação**: uso obrigatório de templates e anexos de artefatos (CI/local).

