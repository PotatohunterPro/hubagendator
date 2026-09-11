# Decisões técnicas (esqueleto)

Inspeção inicial (Etapa 1): repo vazio — só `plano.md`. Sem README, sem auth, sem banco, sem infra.
Todas as escolhas abaixo seguem o plano; divergências temporárias do esqueleto estão marcadas com `TODO(E2/E3)`.

## Decisões aprovadas pelo proprietário do produto

Registradas formalmente a pedido do proprietário. Não são execução silenciosa do agente; são escopo
aprovado e vinculante até revisão explícita.

1. **Stack permanece Vite + Express + tRPC (Drizzle/PostgreSQL).** Não haverá migração para Next.js.
   Justificativa: o backend tRPC já está em produção local com Postgres, testes e tipos compartilhados;
   trocar o framework não agrega valor operacional ao MVP e introduziria risco sem contrapartida.
2. **As 4 cores semânticas (perigo / atenção / informação / sucesso) e o quadro Kanban são escopo
   aprovado**, ainda que **não existam nos 7 protótipos originais do Stitch** (`ux-teste`). Os
   protótipos foram tratados como referência visual/hierarquia, não como limite funcional. O Kanban
   é requisito do `plano2.0.md` (§8) e as cores semânticas são exigidas pelo `UX.md` (§14.2).
   Portanto: semânticos e Kanban **ficam**.

1. **Monorepo npm workspaces** (`client`, `server`, `shared`) — tRPC exige tipos compartilhados; workspaces evitam duplicação.
2. **Auth em esqueleto = header `x-user-id`** (`server/src/context.ts`). TODO(E2): trocar pela sessão segura integrada do projeto (§2). Nenhum cookie manipulado manualmente; frontend usa só tRPC.
3. **Banco desligável**: `server/src/db.ts` retorna `null` sem `DATABASE_URL`; routers usam `store.ts` em memória com o formato das tabelas. TODO(E2): ligar Drizzle, gerar/aplicar migração no Postgres, mover seed para SQL.
4. **`users.id` como varchar** — compatível com o provedor de auth real (UUID ou id externo).
5. **Sem `overdue` no banco** — calculado via `isOverdue()` em `shared` (§7).
6. **Líder = gerencia tudo no esqueleto** (`permissions.ts`). TODO(E3): escopar por `teamMembers`.
7. **PWA conservador**: SW faz cache só do shell; `/trpc` sempre rede; `offline.html` de fallback (§13). Sem offline-first fingido.
8. **Tailwind v4 (plugin Vite)** — menos config que v3; `@import "tailwindcss"`.
9. **Uploads**: só metadados no Postgres (`taskAttachments`); binário em object storage (env `OBJECT_STORAGE_*`). Sem pasta de imagens grandes no repo.

## Fase 2 — executada

- Postgres 16 via Docker (`hubagendor-postgres`, porta 5432). Subir: `docker start hubagendor-postgres`.
- Migração `drizzle/migrations/0000_nifty_logan.sql` gerada e aplicada (11 tabelas + enums + índices).
- Seed real e idempotente (`server/src/seed.ts`): 1 org, Carlos/Gisele/Wellington, equipe Operação, clientes X/Y/Z, 4 tarefas §16, eventos, 1 comentário, 2 notificações.
- Helpers Drizzle em `server/src/db/helpers.ts` (`requireOrgMember`, `logTaskEvent`, `notifyUser`). (Superado na Etapa 3: os routers já usam Drizzle direto.)
- `.env` na raiz; `server/src/db.ts` e `seed.ts` carregam com `dotenv.config({ path: ../../.env })` porque o CWD do workspace é `server/`.
- UX (designer, `docs/UX.md`): tokens semânticos em `client/src/index.css` (`@theme`: accent/danger/attention/info), zero `green-/blue-` hardcoded nos componentes; `TaskCard` com atraso textual ("Atrasada há 2 dias"), métricas com drill-down, skeletons, toast textual, tela pós-criação (Abrir/Criar outra/Voltar).

## Etapa 3 — executada (backend no Postgres)

- `server/src/store.ts` e `stubs.ts` removidos — runtime é 100% Drizzle/Postgres; sem `DATABASE_URL` as procedures retornam `PRECONDITION_FAILED`.
- `tasks.*` reescrito: list (escopos mine/all/team, status, responsável, equipe, cliente, busca em título/descrição/nome do cliente, overdueOnly, due today/none, paginação), getById (+comentários), create/update/assign/setStatus/setDueDate/archive/reopen, addComment/updateComment/deleteComment, getEvents, getSummary, sendReminder.
- Efeitos colaterais: evento em toda mutação relevante (`taskEvents`); notificação interna em atribuir, reatribuir, concluir (p/ criador), reabrir, comentar e cobrar.
- Permissões do plano §10 aplicadas no backend (`permissions.ts` + `requireOrgMember`): colaborador em scope `all` vê só próprias + da equipe; arquivar = admin/gestor; reabrir = gestor/líder/admin (motivo exigido de gestor/líder); comentar exige visão; editar/apagar comentário = autor ou admin/gestor.
- `organization`/`teams`/`clients`/`notifications` reais no Drizzle (leitura p/ membros; escrita p/ admin/gestor). `clients.list` retorna `openTasks` por cliente.
- Testes: `tasks.test.ts` com 15 casos de integração no Postgres real (org isolada por execução + limpeza) cobrindo o §17 — 24 testes verdes no total.
- Smoke E2E via HTTP validado: criar (Carlos→Gisele) → listar → iniciar → comentar → concluir → resumo → histórico → notificação → arquivar.

## plano2.0 — gaps 1–3 + Etapa 4 (Colaborador)

- `tasks.origin` (enum `task_origin`: gestor/rotina/cliente/comercial/interna, anulável) via migração `0001_silly_epoch.sql`; Zod em create/update; select opcional na criação; selo no detalhe.
- Taxa de conclusão em `getSummary` (`completion: {rate, done, total}` sobre não-arquivadas) + faixa no painel com drill-down.
- Anexos: `POST /uploads` (multer, 10MB, allowlist imagens/pdf/docs/zip, exige `x-user-id`, dev grava em `server/uploads/` servido em `/files`) + `tasks.addAttachment` (só metadados no PG + evento). Produção troca o destino por object storage sem mudar a API. Exceção documentada ao "só tRPC": multipart binário não cabe no tRPC — o registro continua via `addAttachment`.
- Minhas tarefas em grupos (Atrasadas/Hoje/Em andamento/Próximas/Concluídas) com `isDueToday` em `lib/format.ts`.
- 30 testes verdes (6 shared + 24 server, incluindo origem, cobrança e anexos).

## Integração do visual `ux-teste` (Hub Precision Operations)

- Identidade trocada de verde para **azul institucional** (`#003f87`/`#0056b3`) + ciano técnico, em `client/src/index.css` (`accent` = marca azul; `cyan`; semânticos danger/attention/info/success). Nenhum hex hardcoded nos componentes.
- `AppShell`/`MobileBottomNav`/`DesktopSidebar` refeitos: cabeçalho com sino + badge de não lidas, bottom nav de 4 itens + FAB "Nova tarefa", sidebar com "Quadro".
- `TaskCard` com **barra lateral semântica de 4px**, chips com borda, prazo relativo + objetivo; ações rápidas "Cobrar" no desktop.
- Painel: cards de indicador horizontais (Atrasadas/Para hoje/Em andamento/Concluídas hoje/Sem prazo/Sem atualização) clicáveis + taxa de conclusão + pills "Precisa da sua atenção".
- Minhas tarefas: pills (Todos/Atrasadas/Em andamento/Concluídas) + grupos por urgência.
- Criar: responsáveis reais (`organization.getMembers`) em cards com iniciais, prioridade em pills, origem, prazo com atalhos, "Mais detalhes" (descrição/equipe/cliente).
- Detalhe: ribbon de status, bento responsável/prazo, ação primária por status, reabertura com motivo, timeline, anexos, histórico de auditoria recolhível.
- Notificações reais agrupadas por categoria + marcar lida/todas; Equipe com `teams.workload` (contagens por membro, sem ranking); Clientes com busca/cadastro/tarefas.
- Kanban `/app/board` (desktop, drag-and-drop nativo com update otimista e rollback; mobile usa listas).
- **Auth sem fallback silencioso**: `createContext` retorna `user=null` sem `x-user-id` válido; procedures protegidas respondem 401. Cliente envia header via `lib/session.ts`. Login funcional em DEV (personas gated por `import.meta.env.DEV`) e explicitamente indisponível em produção até integrar o provedor real.
- Não copiado: dados fictícios, Material Symbols, Tailwind CDN, imagens externas, "em rota", checklist/barra de progresso inexistentes.
- **Logo HUB**: `ux-teste/.../logo.png/screen.png` (1485×538) copiada para `client/public/logo.png`; usada no cabeçalho, sidebar, login, favicon e manifest PWA (theme `#003f87`).

## Fechamento do gap de testes (§39/§40 do plano2.0)

- `tasks.test.ts` (21 casos) confirmado verde no Postgres real; +3 de `permissions.test.ts` = 24 no server.
- Client ganhou infra de teste: `vitest` + `jsdom` + `@testing-library/react` (`client/vitest.config.ts`,
  `client/src/test/setup.ts`, `client/src/test/trpcMock.ts` — mock por procedure com captura de inputs).
- Cobertura de componentes (14 casos): `Tasks.tsx` (criação pelo celular, filtro de atrasadas,
  fluxo de conclusão, erro de rede, loading, empty state, navegação, viewport 360px) e `Board.tsx`
  (colunas, drag-and-drop → setStatus, loading, erro, orientação mobile).
- Total: **44 testes** (6 shared + 24 server + 14 client).
- Nota: o redesign aprovado (`e2f979d`) usa tokens Material 3; as 4 cores semânticas e o Kanban seguem
  como escopo aprovado (ver seção de decisões). `data-testid` adicionados só no Board (sem tela nova).

## Login interno (nome + senha) e alerta de cobrança

- **Autenticação real por nome + senha** (uso interno). `users.passwordHash` (scrypt, `salt:hash`) via
  migração `0002_rich_lorna_dane.sql`. `auth.login` valida credenciais e emite **token de sessão
  assinado com HMAC-SHA256** (`SESSION_SECRET`), stateless, enviado no header `x-session-token`.
- `context.ts` agora é **assíncrono**: verifica o token e carrega usuário + vínculo de organização do
  Postgres. Sem token válido → `user=null` → `401`. Removido o antigo `DEV_USERS`/`x-user-id`.
- **Gestor/admin cria usuários** via `organization.createMember` (nome, senha, papel); nome duplicado
  retorna `CONFLICT`. Tela "Novo usuário" na página Equipe (visível a gestor/admin).
- Seed: **Rodrigo (gestor)** + Carlos/Gisele/Wellington, todos com senha de demonstração `hubsolucao`
  (re-seed atualiza o hash via `onConflictDoUpdate`).
- **Alerta sonoro de cobrança**: `client/src/lib/sound.ts` (Web Audio, dois bipes, sem asset). O
  `AppShell` faz poll de `notifications.list` a cada 15s e, ao surgir `reminder_received` não lida,
  toca o som (+ notificação do sistema se a permissão já foi concedida). Botão de mudo no cabeçalho
  (`hub.sound` no localStorage). Limitação: só toca com a aba aberta; autoplay exige interação prévia.
- Testes: `auth.test.ts` (8 casos) — login válido/inválido, insensível a caixa, token verificável,
  createMember + login do novo usuário, duplicado, colaborador sem permissão. Total: **52 testes**.

## Cores semânticas ampliadas (verde/âmbar) — aprovado

- A pedido do proprietário, além de `error` (crítico/atraso) e `primary` (andamento/seleção),
  foram adicionados **verde (`success`)** para "certo/concluído" e **âmbar (`attention`)** para
  "prazo próximo/atenção", mantendo a base visual Material 3. Tokens em `client/src/index.css`.
- Aplicado em: status concluído, prioridade alta, bordas laterais dos cards, indicadores do painel,
  carga da equipe e categorias de notificação. O `DESIGN_MAPPING.md` original não previa verde/âmbar;
  a mudança é decisão aprovada, não execução silenciosa.

## Agenda Operacional v1 — aprovada e implementada

- **Agenda própria** (sem Google/Apple). Mesma tarefa aparece em painel, lista, Kanban e agenda — sem
  duplicar entidade. Rota `/app/calendar`, item na navegação mobile (Início|Tarefas|Agenda|Equipe|Mais)
  e na sidebar.
- **Banco** (`0003_even_dreadnoughts.sql`): `tasks.scheduled_start`, `tasks.scheduled_end`,
  `tasks.location` + índice `(organization_id, scheduled_start)`. `isScheduled` é **calculado**
  (início e fim preenchidos); não há coluna nem tabela `calendar_events` na v1.
- **Regras** (`shared`): início e fim juntos, fim > início, duração ≤ 24h. `dueAt` continua sendo o
  prazo; `scheduledStart/End` é quando executa.
- **Procedures**: `tasks.create`/`update` aceitam os campos; `tasks.setSchedule`, `tasks.clearSchedule`
  (limpa local só com `clearLocation`), `tasks.checkConflict`, `tasks.agenda` (agendadas do período +
  pendências sem horário, com escopos/filtros e isolamento por organização). Auditoria:
  `scheduled`, `schedule_changed`, `schedule_removed` (com `oldValue`/`newValue`).
- **Conflitos**: sobreposição do mesmo responsável em tarefa aberta (todo/in_progress). Avisa, não
  bloqueia; o gestor confirma ("manter mesmo assim") ou cancela.
- **UI**: visão Dia (lista temporal + seção Sem horário + atrasadas + indicador de hora atual) e
  Semana (colunas no desktop, abas de dia no mobile). Criar no horário abre `/app/tasks/new` pré-preenchido.
  Drag-and-drop só no desktop; mobile usa edição pelo formulário. Formulário ganhou a seção
  "Agendamento" (Sim/Não + data/início/fim/local).
- Testes: `calendar.test.ts` (12 backend) + `Calendar.test.tsx` (3 frontend). Total: **67 testes**.
- Limitações v1: sem eventos independentes, sem mês, sem recorrência, sem sync externo, sem drag no mobile.

## Qualidade: lint e limpeza de dados hardcoded

- **ESLint 9 flat config** (`eslint.config.js`) com `typescript-eslint` e `eslint-plugin-react-hooks`;
  `npm run lint` (raiz) e `lint` por workspace. Passa com **0 erros/avisos**.
- Removidos componentes mortos do redesign que carregavam texto fictício: `AppHeader`
  ("Plantão Ativo"), `BackHeader`, `OperationalFormSection`, `FilterPill`, `DueLabel`.
- Dados hardcoded substituídos por reais:
  - Equipe: banner de carga agora soma `teams.workload` (ativas/pessoas, andamento/hoje/atrasadas);
    removidos os chips de equipe fictícios ("Suporte Técnico" etc.).
  - Notificações: faixa "Fila Operacional" agora usa `unread` real (verde "Em dia" quando 0).
  - Detalhe da tarefa: "OS-8492 · Estação PDV 01" → "Criada por {autor}".
  - Textos "Despacho Ágil"/"Instruções Técnicas"/"técnico" → linguagem do domínio; placeholders sem nomes fixos.

## Notificações de prazo (job) e conflito no formulário

- **Job de notificações** (`server/src/jobs/dueNotifications.ts`): a cada 5 min (e no boot) gera
  `task_overdue` (dueAt < agora) e `task_due_today` (vence hoje) para o responsável de tarefas
  abertas. **Idempotente por dia** (não repete a mesma notificação para a mesma tarefa/dia).
  Sem dependência externa (setInterval). Categorias adicionadas na central de notificações.
- **Conflito no formulário** (`NewTaskPage`): ao habilitar Agendamento com responsável + data/horários
  válidos, consulta `tasks.checkConflict` e exibe aviso âmbar com as atividades sobrepostas —
  **avisa, não bloqueia**. A Agenda também marca cada evento com chip "Conflito" (calculado no
  `tasks.agenda` para o conjunto retornado).
- Testes: `dueNotifications.test.ts` (idempotência) + caso de conflito no formulário em `Tasks.test.tsx`.
  Total: **69 testes** (6 shared + 45 server + 18 client). Lint/typecheck/build verdes.

## Correção de schema (chave primária composta) e E2E

- **Bug encontrado pelo E2E**: `organization_members` e `team_members` não tinham **chave primária
  composta** (exigida no plano §8). Sem isso, `onConflictDoNothing` do seed não deduplicava e cada
  re-seed inseria vínculos duplicados (o responsável aparecia 2×). Corrigido com
  `primaryKey({ columns: [...] })` na migração `0004_slippery_ares.sql`, após dedupe dos dados.
  Re-seed agora é idempotente de fato (4 membros / 2 vínculos de equipe).
- **E2E com Playwright** (`playwright.config.ts` + `e2e/`): 5 testes cobrindo login (válido/inválido),
  cenário de aceite completo (gestor cria agendada → aparece na Agenda → colaborador inicia/comenta/
  conclui → gestor vê concluída + histórico) e conflito no formulário. `npm run test:e2e`.
  Servidores são reaproveitados quando já estão no ar; browsers: `npx playwright install chromium`.
- Estado de validação: lint 0 problemas, typecheck limpo, **69 unit/integração/componente + 5 E2E**,
  build OK.
