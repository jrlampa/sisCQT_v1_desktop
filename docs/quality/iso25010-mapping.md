# Mapeamento ISO/IEC 25010 → Testes e Evidências (sisCQT)

Este documento mapeia características de qualidade (ISO/IEC 25010) para **o que testamos** e **onde estão as evidências** no repo/CI.

## Mapa (alto nível)

| ISO/IEC 25010 | O que validar no sisCQT | Testes existentes (exemplos) | Evidência típica |
|---|---|---|---|
| Functional suitability | Regras do engine, cálculos, importação, endpoints corretos | `tests/engine.test.ts`, `tests/api.test.ts`, `tests/real_xlsx_import.test.ts` | Saída Vitest + logs; (quando aplicável) evidência E2E |
| Reliability | Fluxos principais sem regressão, estados de erro, retries controlados | `e2e/hub_editor_chat_gis.e2e.spec.ts`, cenários negativos em `e2e/auth.e2e.spec.ts` | `playwright-report/`, `test-results/` |
| Usability | Fluxos críticos, validações visíveis, acessibilidade básica | `e2e/a11y.e2e.spec.ts` | Relatório Playwright + logs a11y |
| Security | AuthN/AuthZ, negação por token inválido/ausente, endpoints protegidos | `e2e/auth.e2e.spec.ts`, testes de API (quando cobrirem 401/403) | Playwright report + traces em falhas |
| Performance efficiency | Responsividade percebida e regressões grosseiras (baseline) | (não há suíte dedicada) | (futuro) métricas/benchmarks + thresholds |
| Compatibility | Execução em Chromium/Firefox (E2E), desktop vs web (quando aplicável) | Playwright projects `chromium` + `firefox` | Playwright report por projeto |
| Maintainability | Testes claros e determinísticos; isolamento de dependências | `tests/setup.ts` + padrão de mocks | Revisão + consistência de suite |
| Portability | Build/execução em Windows (CI), desktop empacotado | workflow `CI` + build desktop | logs de CI + artefatos `desktop-dist` |

## Onde ficam as evidências hoje

- **Playwright**:
  - relatório: `playwright-report/` (artefato do CI: `playwright-report`)
  - artefatos de falha: `test-results/` (trace/screenshot/video, quando gerados)
- **Vitest**:
  - saída do runner no console do CI/local

## Observações (melhorias futuras, sem bloquear)

- Se for necessário “audit-ready” mais rígido, recomenda-se adicionar:
  - relatórios estruturados (JUnit) e/ou cobertura (coverage) no Vitest
  - upload de `test-results/` e outputs do unit no CI como artefatos

