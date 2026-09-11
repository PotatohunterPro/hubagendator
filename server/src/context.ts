// Contexto tRPC: sessão por token assinado (header `x-session-token`).
// Sem fallback silencioso — token ausente/inválido => user null => 401.
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { and, eq } from "drizzle-orm";
import type { MemberRole } from "@hubagendor/shared";
import { organizationMembers, users } from "../../drizzle/schema.js";
import { getDb } from "./db.js";
import { verifySession } from "./auth/session.js";

export interface SessionUser {
  id: string;
  name: string;
  organizationId: string;
  role: MemberRole;
}

export interface Context {
  user: SessionUser | null;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const raw = req.headers["x-session-token"];
  const token = Array.isArray(raw) ? raw[0] : raw;
  const userId = verifySession(token);
  if (!userId) return { user: null };

  const db = getDb();
  if (!db) return { user: null };

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      active: users.active,
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(users)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .where(and(eq(users.id, userId), eq(organizationMembers.active, true)))
    .limit(1);

  if (!row || !row.active) return { user: null };
  return {
    user: { id: row.id, name: row.name, organizationId: row.organizationId, role: row.role },
  };
}
