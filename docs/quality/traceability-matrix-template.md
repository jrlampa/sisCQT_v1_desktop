# Template — Matriz de Rastreabilidade (Requisito → Teste → Evidência)

Este template pode ser mantido em Markdown (aqui) ou copiado para uma planilha (CSV/Excel) mantendo as mesmas colunas.

## Convenções

- **Requisito**: `REQ-0001`
- **Caso de teste**: `TC-0001`
- **Execução**: `TE-YYYYMMDD-01`
- **Incidente**: `TI-YYYYMMDD-01`
- **Evidência**: caminho no repo/artefato CI (ex.: `playwright-report/...`, `test-results/...`)

## Colunas recomendadas

| Req ID | Descrição do requisito | Fonte (doc/issue) | Risco | ISO/IEC 25010 | Testes (TC) | Automação | Evidência (link/caminho) | Execução (TE) | Incidente (TI) | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| REQ-0001 | Login deve bloquear usuário sem token | Issue #__ / `docs/AUTH.md` | Alto | Security | TC-0001, TC-0002 | Sim | `playwright-report/...` | TE-20260125-01 | - | OK |

## Dicas práticas

- Para requisitos normativos (ANEEL/PRODIST/ABNT), inclua a **referência normativa** na descrição ou na fonte.
- Se um requisito for coberto por unit + E2E, liste ambos os TC e a evidência principal do ciclo.
- Em falha, preencha o `TI-...` e mantenha evidências (trace/screenshot/log).

