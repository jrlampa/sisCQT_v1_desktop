# Política de Testes (ISO/IEC 29119 – alinhamento prático)

## 1. Propósito

Estabelecer diretrizes para **planejar, executar e evidenciar testes** do sisCQT (SPA + API + Desktop), garantindo:

- **Rastreabilidade** (Requisito → Teste → Evidência)
- **Repetibilidade** (execução determinística quando aplicável)
- **Gestão de riscos** (priorização por impacto técnico/normativo/segurança)
- **Evidências auditáveis** (relatórios, logs, artefatos de CI)

## 2. Escopo

Aplica-se a:

- Frontend (React/Vite)
- Backend (Express)
- Componentes/serviços críticos (engine elétrico, importação XLSX, auth, confirmações/erros)
- E2E (fluxos principais no navegador)

Fora de escopo (quando não explicitamente planejado):

- Testes de performance de carga em produção (p.ex. stress/soak)
- Certificação formal ISO/IEC 29119 / ISO 9001 / ISO 27001

## 3. Princípios

- **Shift-left**: validar cedo (unit/integration) e manter E2E como validação de fluxo.
- **Automação primeiro** para regressão de fluxos críticos e regras normativas.
- **Falha deve gerar evidência**: toda falha relevante deve resultar em incidente com evidências anexas.
- **Ambientes e dados controlados**: testes não devem depender de credenciais reais; preferir mocks/fixtures.
- **Segurança por padrão**: testes devem cobrir autenticação/autorização e cenários negativos.

## 4. Papéis e responsabilidades (mínimo)

- **Dev/Owner do módulo**: escreve/atualiza testes do módulo, corrige falhas, mantém evidências.
- **Revisor(a) técnico(a)**: valida cobertura mínima, DoR/DoD, rastreabilidade e critérios de aceite.
- **Release/CI owner**: garante que CI execute e armazene evidências (artefatos).

## 5. Critérios e gates (alto nível)

- Mudanças em regras do engine/importação/auth devem incluir:
  - atualização de testes (unit/integration e/ou E2E)
  - atualização da matriz de rastreabilidade
  - evidências no relatório/sumário da execução

## 6. Artefatos oficiais deste pacote

- Política/Estratégia/Plano: `docs/quality/*.md`
- Templates: `docs/quality/templates/*`
- Matriz: `docs/quality/traceability-matrix-template.md`
- Mapeamento 25010: `docs/quality/iso25010-mapping.md`

