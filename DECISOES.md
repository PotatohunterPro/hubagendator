# Decisões técnicas (esqueleto)

Inspeção inicial (Etapa 1): repo vazio — só `plano.md`. Sem README, sem auth, sem banco, sem infra.
Todas as escolhas abaixo seguem o plano; divergências temporárias do esqueleto estão marcadas com `TODO(E2/E3)`.

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
- Helpers Drizzle em `server/src/db/helpers.ts` (`requireOrgMember`, `logTaskEvent`, `notifyUser`). Runtime dos routers AINDA usa o store em memória; a ligação Drizzle é a Etapa 3.
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
