import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ({ user: ctx.user })),
  logout: publicProcedure.mutation(() => ({ ok: true })),
  getSession: protectedProcedure.query(({ ctx }) => ({ session: { user: ctx.user } })),
  // Esqueleto dev: troca de usuário via header x-user-id (carlos|gisele|wellington).
  devLogin: publicProcedure.input(z.object({ userId: z.string() })).mutation(({ input }) => ({
    ok: true,
    hint: `Envie header x-user-id: ${input.userId}`,
  })),
});
