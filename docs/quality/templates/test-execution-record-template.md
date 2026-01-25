# Template — Registro de Execução de Testes (ISO/IEC 29119)

## Identificação

- **ID da execução**: `TE-YYYYMMDD-__`
- **Data/hora**:
- **Responsável**:
- **Contexto**: ( ) Local ( ) CI
- **Branch/Commit**:
- **Sistema operacional**:

## Escopo executado

- **Plano/ciclo**: (referenciar `docs/quality/29119-test-plan.md` ou ciclo interno)
- **Suites**:
  - ( ) Unit/Integration (Vitest)
  - ( ) E2E (Playwright)
  - ( ) A11y (Playwright + axe)
  - ( ) Visual snapshots (Playwright)

## Comandos executados

- Unit/Integration:
  - `npm run test:unit`
- E2E:
  - `npm run test:e2e`

## Resultado (resumo)

- **Passaram**:
- **Falharam**:
- **Bloqueados**:
- **Observações de flakiness** (se houve retries):

## Execução por caso de teste

| Caso (TC-____) | Tipo | Resultado (OK/FAIL/BLOCK) | Evidência | Incidente (TI-____) |
|---|---|---|---|---|
| TC-____ | E2E | OK | `playwright-report/...` | - |

## Evidências anexadas (links/caminhos)

- Playwright report: `playwright-report/` (ou link do artefato no CI)
- Test results: `test-results/` (trace/video/screenshot, se gerados)
- Logs/prints adicionais:

## Incidentes abertos/atualizados

- `TI-____`:

## Aprovação (quando aplicável)

- **Revisor(a)**:
- **Data**:

