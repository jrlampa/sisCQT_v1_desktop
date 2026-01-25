# Definições de DoR/DoD (Definition of Ready / Definition of Done)

## DoR — pronto para iniciar (requisito/issue/PR)

Um item está **Ready** quando:

- **Objetivo claro** e impacto descrito.
- **Critérios de aceite** objetivos (inclui cenários negativos quando aplicável).
- **Riscos conhecidos** (ex.: engine, importação, segurança) sinalizados.
- **Rastreabilidade inicial** criada:
  - requisito recebe um ID (ex.: `REQ-0001`)
  - existe um rascunho de mapeamento Requisito → Caso(s) de teste
- **Ambiente/dados** para teste definidos (mocks/fixtures; sem segredos).

## DoD — pronto para entregar (código + evidências)

Um item está **Done** quando:

- **Implementação** concluída e revisada.
- **Testes**:
  - `npm run test:unit` passa
  - `npm run test:e2e` passa (ou justificativa documentada quando não aplicável)
- **Evidências** anexadas:
  - Playwright report (`playwright-report/` no CI) e evidências de falha quando houver
  - logs/prints relevantes quando necessário
- **Incidentes**:
  - falhas relevantes geram incidente (template) e são triadas
- **Rastreabilidade** atualizada:
  - matriz Requisito → Teste → Evidência preenchida
  - mapeamento ISO/IEC 25010 (quando aplicável) atualizado

