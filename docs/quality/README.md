# Pacote de documentação de testes “audit-ready”

Este pacote organiza **artefatos e evidências de testes** de forma “audit-ready”, inspirado em:

- **ISO/IEC 29119** (documentação e gestão de testes)
- **ISO/IEC 25010** (mapeamento para características de qualidade)

**Importante**: isto **não** promete certificação ISO. É um conjunto de documentos práticos para rastreabilidade, repetibilidade e evidências.

## Como usar no sisCQT

- **Testes automatizados (existentes)**: ver `docs/TESTING.md`
  - Unit/integração: `npm run test:unit`
  - E2E: `npm run test:e2e`
- **Evidências típicas**:
  - Playwright: `playwright-report/` (HTML) + `test-results/` (traces, vídeos, screenshots em falhas)
  - Vitest: saída do console (e, opcionalmente, relatórios/coverage se configurados no futuro)
  - CI: artefato `playwright-report` no workflow `CI` (`.github/workflows/ci.yml`)

## Índice (ISO/IEC 29119)

- **Política de Testes**: [`29119-test-policy.md`](./29119-test-policy.md)
- **Estratégia de Testes**: [`29119-test-strategy.md`](./29119-test-strategy.md)
- **Plano de Testes**: [`29119-test-plan.md`](./29119-test-plan.md)
- **DoR/DoD**: [`dor-dod.md`](./dor-dod.md)
- **Templates**:
  - Caso de teste: [`templates/test-case-template.md`](./templates/test-case-template.md)
  - Registro de execução: [`templates/test-execution-record-template.md`](./templates/test-execution-record-template.md)
  - Incidente de teste (bug): [`templates/test-incident-report-template.md`](./templates/test-incident-report-template.md)
  - Relatório/Sumário de testes: [`templates/test-summary-report-template.md`](./templates/test-summary-report-template.md)
- **Matriz de rastreabilidade**: [`traceability-matrix-template.md`](./traceability-matrix-template.md)

## Mapeamento (ISO/IEC 25010)

- **Mapa de qualidade → testes/evidências**: [`iso25010-mapping.md`](./iso25010-mapping.md)

