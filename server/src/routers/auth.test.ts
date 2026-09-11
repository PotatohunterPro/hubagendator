// Testes de autenticação interna (nome + senha) e criação de usuários.
// Roda contra o Postgres real com organização isolada por execução.
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { organizationMembers, organizations, users } from "../../../drizzle/schema.js";
import { appRouter } from "./index.js";
import { hashPassword } from "../auth/password.js";
import { verifySession } from "../auth/session.js";
import type { SessionUser } from "../context.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const runId = randomUUID().slice(0, 8);
const orgId = randomUUID();
const managerId = `auth-${runId}-manager`;
const managerName = `Rodrigo ${runId}`;
const managerPassword = "hubsolucao";

const managerSession: SessionUser = { id: managerId, name: managerName, organizationId: orgId, role: "manager" };
const caller = () => appRouter.createCaller({ user: managerSession });
const anon = () => appRouter.createCaller({ user: null });

beforeAll(async () => {
  await db.insert(organizations).values({ id: orgId, name: "Org auth teste" });
  await db.insert(users).values({ id: managerId, name: managerName, passwordHash: hashPassword(managerPassword) });
  await db.insert(organizationMembers).values({ organizationId: orgId, userId: managerId, role: "manager" });
});

afterAll(async () => {
  const members = await db
    .select({ id: organizationMembers.userId })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, orgId));
  await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgId));
  for (const m of members) await db.delete(users).where(eq(users.id, m.id));
  await db.delete(organizations).where(eq(organizations.id, orgId));
  await pool.end();
});

describe("auth.login (nome + senha)", () => {
  it("autentica com credenciais válidas e emite token verificável", async () => {
    const res = await anon().auth.login({ name: managerName, password: managerPassword });
    expect(res.user.name).toBe(managerName);
    expect(res.user.role).toBe("manager");
    expect(verifySession(res.token)).toBe(managerId);
  });

  it("é insensível a maiúsculas/minúsculas no nome", async () => {
    const res = await anon().auth.login({ name: managerName.toUpperCase(), password: managerPassword });
    expect(res.user.id).toBe(managerId);
  });

  it("rejeita senha incorreta", async () => {
    await expect(anon().auth.login({ name: managerName, password: "errada" }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejeita nome inexistente", async () => {
    await expect(anon().auth.login({ name: `ninguem-${runId}`, password: managerPassword }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("token inválido não vira sessão", () => {
    expect(verifySession("lixo.token")).toBeNull();
    expect(verifySession(null)).toBeNull();
  });
});

describe("organization.createMember", () => {
  it("gestor cria usuário e o novo usuário consegue logar", async () => {
    const name = `Gisele ${runId}`;
    const created = await caller().organization.createMember({ name, password: "senha123", role: "member" });
    expect(created.role).toBe("member");

    const login = await anon().auth.login({ name, password: "senha123" });
    expect(login.user.id).toBe(created.id);
    expect(login.user.role).toBe("member");
  });

  it("rejeita nome duplicado", async () => {
    const name = `Duplicado ${runId}`;
    await caller().organization.createMember({ name, password: "senha123", role: "member" });
    await expect(caller().organization.createMember({ name, password: "outra123", role: "member" }))
      .rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("colaborador não pode criar usuário", async () => {
    const memberSession: SessionUser = { id: `auth-${runId}-x`, name: "X", organizationId: orgId, role: "member" };
    await expect(appRouter.createCaller({ user: memberSession }).organization.createMember({ name: `N ${runId}`, password: "senha123", role: "member" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
