# Estratégia de Testes (ISO/IEC 29119 – alinhamento prático)

## 1. Objetivos

- Minimizar risco de regressão nos fluxos críticos (Login → Hub → Editor → Chatbot → GIS).
- Validar regras normativas/cálculos do engine e importações.
- Gerar evidências consistentes para auditoria interna/externa.

## 2. Níveis de teste e ferramentas

- **Unit/integration (Vitest + jsdom + supertest)**:
  - foco: serviços, utilitários, regras do engine, API (Express), componentes React críticos
  - local: `npm run test:unit`
  - evidências: saída do runner (e logs) + (opcional futuro) relatórios estruturados
- **E2E (Playwright)**:
  - foco: fluxos completos, cenários negativos, a11y, snapshots visuais
  - local/CI: `npm run test:e2e`
  - evidências: `playwright-report/` + `test-results/` (trace/screenshot/video em falhas)

## 3. Estratégia por risco (exemplos)

- **Alto risco (prioridade P0)**:
  - engine elétrico (CQT, queda de tensão, ocupação de transformador)
  - importação e verificação (XLSX, validações)
  - autenticação e autorização (JWT/roles), rotas protegidas
- **Médio risco (P1)**:
  - UI de edição e persistência de projeto, estados de erro
  - integrações externas (IA/GIS) com fallback/limites
- **Baixo risco (P2)**:
  - layout/estilos sem mudança funcional

## 4. Testes negativos obrigatórios (baseline)

- Auth:
  - token ausente/expirado → 401/redirect
  - permissões insuficientes → 403/negação clara
- Validação:
  - payload inválido → 400 com erro estruturado
  - limites de payload/rate limit (quando aplicável) → erro esperado

## 5. Regressão e critérios de aceitação

- PRs que alterem P0 devem ter:
  - pelo menos 1 teste unit/integration cobrindo a regra alterada
  - pelo menos 1 teste E2E cobrindo o fluxo impactado (quando aplicável)
  - rastreabilidade atualizada (matriz)

## 6. Evidências e armazenamento

- **CI (GitHub Actions)**:
  - workflow `CI` roda unit + e2e em Windows
  - relatório Playwright é publicado como artefato `playwright-report`
- **Local**:
  - anexar evidências (prints/logs/trechos de relatório) no registro de execução e no incidente, quando houver

## 7. Padrões de identificação

- IDs recomendados:
  - Requisito: `REQ-####`
  - Caso de teste: `TC-####`
  - Execução: `TE-YYYYMMDD-##`
  - Incidente: `TI-YYYYMMDD-##`

