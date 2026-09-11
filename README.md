# HubAgendator — MVP operacional

Sistema interno de gestão operacional, mobile-first (PWA). Referências: `plano.md` e `plano2.0.md`
(produto), `docs/UX.md` (experiência), `DECISOES.md` (decisões, incluindo as aprovadas pelo proprietário).

**Fase real:** Etapas 1–4 do `plano2.0.md` concluídas, integração visual `ux-teste` (identidade HUB)
concluída, Kanban (Etapa 6) e PWA (Etapa 7) entregues. Fechando o gap de testes do §39/§40.

## Estrutura

```
client/   React 19 + Vite + TS + Tailwind v4 + tRPC client + PWA (manifest + sw + offline)
server/   Express + tRPC + Zod + Drizzle — 100% Postgres
shared/   Tipos, enums, regras (isOverdue, canTransition) e schemas Zod — fonte única
drizzle/  schema.ts (11 tabelas) + migrations aplicadas
ux-teste/ Referência visual aprovada (Stitch "Hub Precision Operations")
```

## Rodar (dev)

```bash
docker start hubagendor-postgres   # Postgres 16 local (1ª vez: ver DECISOES.md)
npm install
npm run dev:server   # http://localhost:3333/health + /trpc
npm run dev:client   # http://localhost:5173 (proxy /trpc, /uploads, /files -> 3333)
```

Login em DEV: personas em `/login` (gated por `import.meta.env.DEV`). Não há fallback silencioso —
sem sessão, o backend responde `401`. Em produção o login depende da integração do provedor real.

## Banco

```bash
npm run db:generate   # nova migração a partir do schema
npm run db:migrate    # aplica no Postgres
npm run db:seed       # dados demo §16 (idempotente)
```

## Scripts

| Comando | O quê |
|---|---|
| `npm run lint` | ESLint 9 (flat config) — TS/React em todo o monorepo |
| `npm run typecheck` | tsc nos 3 workspaces |
| `npm run test` | vitest — shared (6) + server (45, integração no Postgres) + client (18, componentes) |
| `npm run test:e2e` | Playwright (Chromium) — fluxo real: login, criar agendada, executar, concluir, conflito |
| `npm run build` | build client + server |

### E2E (Playwright)

Requer Postgres + servidores no ar (o `playwright.config.ts` reaproveita servidores já rodando e sobe os que faltarem). Primeira vez: `npx playwright install chromium`.

```bash
npm run test:e2e
```

## Rotas

`/` → `/app` • `/login` • `/app` • `/app/tasks` • `/app/tasks/new` • `/app/tasks/:id` •
`/app/my-tasks` • `/app/calendar` (Agenda) • `/app/board` (Kanban) • `/app/team` • `/app/clients` •
`/app/clients/:id` • `/app/notifications` • `/app/settings`

## Definition of Done (resumo §40)

Schema+migração, validação+autorização no backend, API tipada, loading/vazio/erro, mobile,
histórico, testes, typecheck e build verdes, sem dados reais.
