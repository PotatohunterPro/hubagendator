// Clientes — plano.md §9. Cadastro simples; escrita p/ admin/gestor.
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { clients, tasks } from "../../../drizzle/schema.js";
import { getDb } from "../db.js";
import { requireOrgMember } from "../db/helpers.js";
import { protectedProcedure, router } from "../trpc.js";
import type { Context } from "../context.js";

type Ctx = { user: NonNullable<Context["user"]> };

const clientInput = z.object({
  name: z.string().trim().min(1).max(160),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function assertManager(ctx: Ctx) {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Só admin ou gestor gerencia clientes" });
  }
}

export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const rows = await db.select().from(clients).where(eq(clients.organizationId, me.organizationId));
    const openTasks = await db
      .select({ clientId: tasks.clientId })
      .from(tasks)
      .where(eq(tasks.organizationId, me.organizationId));
    const openByClient = new Map<string, number>();
    for (const t of openTasks) {
      if (!t.clientId) continue;
      openByClient.set(t.clientId, (openByClient.get(t.clientId) ?? 0) + 1);
    }
    return rows.map((c) => ({ ...c, openTasks: openByClient.get(c.id) ?? 0 }));
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, input.id), eq(clients.organizationId, me.organizationId)))
      .limit(1);
    if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
    const linked = await db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status })
      .from(tasks)
      .where(and(eq(tasks.clientId, client.id), eq(tasks.organizationId, me.organizationId)));
    return { ...client, tasks: linked };
  }),

  create: protectedProcedure.input(clientInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    assertManager(ctx as Ctx);
    const [client] = await db
      .insert(clients)
      .values({
        organizationId: (ctx as Ctx).user.organizationId,
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        email: input.email || null,
        notes: input.notes || null,
      })
      .returning();
    return client;
  }),

  update: protectedProcedure.input(clientInput.extend({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    assertManager(ctx as Ctx);
    const me = (ctx as Ctx).user;
    const [client] = await db
      .update(clients)
      .set({
        name: input.name,
        company: input.company || null,
        phone: input.phone || null,
        email: input.email || null,
        notes: input.notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, input.id), eq(clients.organizationId, me.organizationId)))
      .returning();
    if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
    return client;
  }),

  archive: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    assertManager(ctx as Ctx);
    const me = (ctx as Ctx).user;
    const [client] = await db
      .update(clients)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(clients.id, input.id), eq(clients.organizationId, me.organizationId)))
      .returning();
    if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
    return { ok: true as const };
  }),
});
