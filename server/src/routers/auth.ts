import { TRPCError } from "@trpc/server";
import { and, eq, ilike } from "drizzle-orm";
import { loginSchema } from "@hubagendor/shared";
import { organizationMembers, users } from "../../../drizzle/schema.js";
import { getDb } from "../db.js";
import { verifyPassword } from "../auth/password.js";
import { signSession } from "../auth/session.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const authRouter = router({
  /** Login interno por nome + senha. Retorna token de sessão. */
  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const db = getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível" });

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.active, true), ilike(users.name, input.name)))
      .limit(1);

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Nome ou senha inválidos" });
    }

    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.userId, user.id), eq(organizationMembers.active, true)))
      .limit(1);

    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Usuário sem organização ativa" });

    return {
      token: signSession(user.id),
      user: { id: user.id, name: user.name, organizationId: member.organizationId, role: member.role },
    };
  }),

  me: protectedProcedure.query(({ ctx }) => ({ user: ctx.user })),
  logout: publicProcedure.mutation(() => ({ ok: true })),
  getSession: protectedProcedure.query(({ ctx }) => ({ session: { user: ctx.user } })),
});
