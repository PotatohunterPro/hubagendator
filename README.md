# HubAgendor — esqueleto MVP (Fase 2 concluída)

Sistema de gestão operacional mobile-first (PWA). Referências: `plano.md` (produto), `docs/UX.md` (experiência), `DECISOES.md` (assunções).

## Estrutura

```
client/   React 19 + Vite + TS + Tailwind + tRPC client + PWA (manifest + sw + offline)
server/   Express + tRPC + Zod + Drizzle (Postgres; store em memória até a Etapa 2)
shared/   Tipos, enums, regras (isOverdue, canTransition) e schemas Zod — fonte única
drizzle/  schema.ts (11 tabelas do plano §8) + migrations
```

## Rodar (dev)

```bash
docker start hubagendor-postgres   # Postgres 16 local (ou docker run na 1ª vez, ver DECISOES.md)
npm install
npm run dev:server   # http://localhost:3333/health + /trpc
npm run dev:client   # http://localhost:5173 (proxy /trpc -> 3333)
```

Trocar usuário dev via header `x-user-id: carlos|gisele|wellington` (o client usa `carlos` por padrão no esqueleto).

## Banco (Fase 2 — já aplicada localmente)

```bash
npm run db:generate   # nova migração a partir do schema
npm run db:migrate    # aplica no Postgres
npm run db:seed       # dados demo §16 (idempotente)
```

## Scripts

| Comando | O quê |
|---|---|
| `npm run typecheck` | tsc nos 3 workspaces |
| `npm run test` | vitest (shared: regras; server: permissões) |
| `npm run build` | build client + server |

## Rotas (plano §5.3)

`/` → `/app` • `/login` • `/app` • `/app/tasks` • `/app/tasks/new` • `/app/tasks/:id` • `/app/my-tasks` • `/app/team` • `/app/clients` • `/app/notifications` • `/app/settings`

## Definition of Done (resumo §19)

Schema+migração, validação+autorização no backend, API tipada, loading/vazio/erro, mobile, histórico, testes, lint/typecheck/build verdes, sem dados reais.
