// Organização e membros — plano.md §9. Leitura p/ membros; escrita p/ admin/gestor.
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { createMemberSchema } from "@hubagendor/shared";
import { organizationMembers, organizations, users } from "../../../drizzle/schema.js";
import { getDb } from "../db.js";
import { requireOrgMember } from "../db/helpers.js";
import { hashPassword } from "../auth/password.js";
import { protectedProcedure, router } from "../trpc.js";
import type { Context } from "../context.js";

type Ctx = { user: NonNullable<Context["user"]> };

function assertManager(ctx: Ctx) {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Só admin ou gestor gerencia a organização" });
  }
}

export const organizationRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    const [org] = await db.select().from(organizations).where(eq(organizations.id, me.organizationId)).limit(1);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organização não encontrada" });
    return { id: org.id, name: org.name, timezone: org.timezone };
  }),

  update: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(160) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      assertManager(ctx as Ctx);
      const [org] = await db
        .update(organizations)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(organizations.id, (ctx as Ctx).user.organizationId))
        .returning();
      return { ok: true as const, id: org.id, name: org.name };
    }),

  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const rows = await db
      .select({
        id: users.id, name: users.name, email: users.email,
        role: organizationMembers.role, active: organizationMembers.active,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, me.organizationId));
    return rows;
  }),

  /** Gestor/admin cria um usuário da equipe (login interno por nome + senha). */
  createMember: protectedProcedure.input(createMemberSchema).mutation(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    assertManager(ctx as Ctx);
    const me = (ctx as Ctx).user;

    const [existing] = await db.select().from(users).where(ilike(users.name, input.name)).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Já existe um usuário com esse nome" });

    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      name: input.name,
      email: input.email || null,
      passwordHash: hashPassword(input.password),
    });
    await db.insert(organizationMembers).values({
      organizationId: me.organizationId,
      userId,
      role: input.role,
    });
    return { id: userId, name: input.name, role: input.role, active: true };
  }),

  updateMemberRole: protectedProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["admin", "manager", "leader", "member"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      assertManager(ctx as Ctx);
      const me = (ctx as Ctx).user;
      if (input.userId === me.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode alterar seu próprio papel" });
      const updated = await db
        .update(organizationMembers)
        .set({ role: input.role })
        .where(and(eq(organizationMembers.organizationId, me.organizationId), eq(organizationMembers.userId, input.userId)))
        .returning();
      if (!updated.length) throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado" });
      return { ok: true as const };
    }),

  deactivateMember: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      assertManager(ctx as Ctx);
      const me = (ctx as Ctx).user;
      if (input.userId === me.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode desativar a si mesmo" });
      await db
        .update(organizationMembers)
        .set({ active: false })
        .where(and(eq(organizationMembers.organizationId, me.organizationId), eq(organizationMembers.userId, input.userId)));
      return { ok: true as const };
    }),
});
