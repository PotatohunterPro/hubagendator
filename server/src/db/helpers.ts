// Helpers de banco — plano.md Etapa 2. Operações Drizzle reutilizadas pelos
// routers na Etapa 3 (hoje o runtime ainda usa o store em memória).
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { notifications, organizationMembers, taskEvents } from "../../../drizzle/schema.js";
import type { Db } from "../db.js";

export async function requireOrgMember(db: Db, organizationId: string, userId: string) {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!member || !member.active) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Usuário fora da organização" });
  }
  return member;
}

export async function logTaskEvent(
  db: Db,
  input: { taskId: string; actorId: string | null; eventType: string; oldValue?: unknown; newValue?: unknown; metadata?: unknown },
) {
  const [row] = await db
    .insert(taskEvents)
    .values({
      taskId: input.taskId,
      actorId: input.actorId,
      eventType: input.eventType,
      oldValue: (input.oldValue ?? null) as never,
      newValue: (input.newValue ?? null) as never,
      metadata: (input.metadata ?? null) as never,
    })
    .returning();
  return row;
}

export async function notifyUser(
  db: Db,
  input: { organizationId: string; userId: string; type: string; taskId?: string; title: string; body: string },
) {
  const [row] = await db
    .insert(notifications)
    .values({
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      taskId: input.taskId,
      title: input.title,
      body: input.body,
    })
    .returning();
  return row;
}
