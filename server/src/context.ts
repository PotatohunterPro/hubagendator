// Contexto tRPC: integra ao mecanismo de autenticação do projeto.
// ESQUELETO: lê `x-user-id` (dev) — trocar pelo session/cookie real na Etapa 2.
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { MemberRole } from "@hubagendor/shared";

export interface SessionUser {
  id: string;
  name: string;
  organizationId: string;
  role: MemberRole;
}

export interface Context {
  user: SessionUser | null;
}

const DEMO_ORG = "e0000000-0000-4000-8000-000000000001"; // org do seed (Etapa 2)

const DEV_USERS: Record<string, SessionUser> = {
  carlos: { id: "carlos", name: "Carlos", organizationId: DEMO_ORG, role: "manager" },
  gisele: { id: "gisele", name: "Gisele", organizationId: DEMO_ORG, role: "member" },
  wellington: { id: "wellington", name: "Wellington", organizationId: DEMO_ORG, role: "member" },
};

export function createContext({ req }: CreateExpressContextOptions): Context {
  const raw = req.headers["x-user-id"];
  const key = Array.isArray(raw) ? raw[0] : raw;
  const user = (key ? DEV_USERS[key] : undefined) ?? DEV_USERS.carlos;
  return { user: user ?? null };
}
