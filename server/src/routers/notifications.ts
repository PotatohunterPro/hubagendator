// Notificações internas — plano.md §9 e §14 (UX §12).
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { notifications } from "../../../drizzle/schema.js";
import { getDb } from "../db.js";
import { requireOrgMember } from "../db/helpers.js";
import { protectedProcedure, router } from "../trpc.js";
import type { Context } from "../context.js";
import { unreadCount } from "./tasks.js";

type Ctx = { user: NonNullable<Context["user"]> };

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }).default({}))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
      const me = (ctx as Ctx).user;
      await requireOrgMember(db, me.organizationId, me.id);
      const conds = [eq(notifications.userId, me.id)];
      if (input.unreadOnly) conds.push(isNull(notifications.readAt));
      const items = await db
        .select()
        .from(notifications)
        .where(and(...conds))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      return {
        items: items.map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), readAt: n.readAt ? n.readAt.toISOString() : null })),
        unread: await unreadCount(db, me.id),
      };
    }),

  markAsRead: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, input.id), eq(notifications.userId, me.id)))
      .returning();
    if (!updated.length) throw new TRPCError({ code: "NOT_FOUND", message: "Notificação não encontrada" });
    return { ok: true as const };
  }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });
    const me = (ctx as Ctx).user;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
    return { ok: true as const };
  }),
});
