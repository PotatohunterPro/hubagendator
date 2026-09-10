// Equipes — plano.md §9. Leitura p/ membros; escrita p/ admin/gestor.
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { teamMembers, teams, users } from "../../../drizzle/schema.js";
import { getDb } from "../db.js";
import { requireOrgMember } from "../db/helpers.js";
import { protectedProcedure, router } from "../trpc.js";
import type { Context } from "../context.js";

type Ctx = { user: NonNullable<Context["user"]> };

function assertManager(ctx: Ctx) {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Só admin ou gestor gerencia equipes" });
  }
}

async function getOrgTeam(db: NonNullable<ReturnType<typeof getDb>>, orgId: string, id: string) {
  const [team] = await db.select().from(teams).where(and(eq(teams.id, id), eq(teams.organizationId, orgId))).limit(1);
  if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Equipe não encontrada" });
  return team;
}

export const teamsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    return db.select().from(teams).where(eq(teams.organizationId, me.organizationId));
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const team = await getOrgTeam(db, me.organizationId, input.id);
    const members = await db
      .select({ id: users.id, name: users.name })
      .from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, team.id));
    return { ...team, members };
  }),

  create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(160) })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    assertManager(ctx as Ctx);
    const [team] = await db.insert(teams).values({ organizationId: (ctx as Ctx).user.organizationId, name: input.name }).returning();
    return team;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(160), active: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      assertManager(ctx as Ctx);
      const me = (ctx as Ctx).user;
      await getOrgTeam(db, me.organizationId, input.id);
      const [team] = await db
        .update(teams)
        .set({ name: input.name, ...(input.active !== undefined ? { active: input.active } : {}), updatedAt: new Date() })
        .where(eq(teams.id, input.id))
        .returning();
      return team;
    }),

  addMember: protectedProcedure
    .input(z.object({ teamId: z.string().uuid(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      assertManager(ctx as Ctx);
      const me = (ctx as Ctx).user;
      await getOrgTeam(db, me.organizationId, input.teamId);
      await requireOrgMember(db, me.organizationId, input.userId);
      await db.insert(teamMembers).values({ teamId: input.teamId, userId: input.userId }).onConflictDoNothing();
      return { ok: true as const };
    }),

  removeMember: protectedProcedure
    .input(z.object({ teamId: z.string().uuid(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      assertManager(ctx as Ctx);
      await getOrgTeam(db, (ctx as Ctx).user.organizationId, input.teamId);
      await db
        .delete(teamMembers)
        .where(and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.userId, input.userId)));
      return { ok: true as const };
    }),

});
