// Testes de integração do backend — plano.md §17. Roda contra o Postgres real
// (DATABASE_URL), com organização isolada por execução e limpeza ao final.
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { organizationMembers, organizations, tasks, users } from "../../../drizzle/schema.js";
import { appRouter } from "./index.js";
import type { SessionUser } from "../context.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const runId = randomUUID().slice(0, 8);
const orgId = randomUUID();
const uid = (name: string) => `t-${runId}-${name}`;

const manager: SessionUser = { id: uid("carlos"), name: "T-Carlos", organizationId: orgId, role: "manager" };
const member: SessionUser = { id: uid("gisele"), name: "T-Gisele", organizationId: orgId, role: "member" };
const other: SessionUser = { id: uid("well"), name: "T-Well", organizationId: orgId, role: "member" };
const outsider: SessionUser = { id: uid("out"), name: "T-Out", organizationId: orgId, role: "member" };

const callerFor = (u: SessionUser) => appRouter.createCaller({ user: u });

beforeAll(async () => {
  await db.insert(organizations).values({ id: orgId, name: "Org teste", timezone: "America/Sao_Paulo" });
  await db.insert(users).values([manager, member, other, outsider].map((u) => ({ id: u.id, name: u.name })));
  await db.insert(organizationMembers).values([
    { organizationId: orgId, userId: manager.id, role: "manager" },
    { organizationId: orgId, userId: member.id, role: "member" },
    { organizationId: orgId, userId: other.id, role: "member" },
  ]);
});

afterAll(async () => {
  await db.delete(tasks).where(eq(tasks.organizationId, orgId));
  await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
  for (const u of [manager, member, other, outsider]) {
    await db.delete(users).where(eq(users.id, u.id));
  }
  await pool.end();
});

describe("tasks.create", () => {
  it("cria tarefa válida e notifica o responsável", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Cobrar Cliente X", assigneeId: member.id });
    expect(task.status).toBe("todo");
    expect(task.assigneeId).toBe(member.id);

    const events = await callerFor(manager).tasks.getEvents({ id: task.id });
    expect(events.map((e) => e.eventType)).toContain("created");

    const notifs = await callerFor(member).notifications.list({});
    expect(notifs.items.some((n) => n.taskId === task.id && n.type === "task_assigned")).toBe(true);
  });

  it("rejeita título vazio", async () => {
    await expect(callerFor(manager).tasks.create({ title: "  ", assigneeId: member.id }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita criação sem responsável", async () => {
    await expect(callerFor(manager).tasks.create({ title: "Sem dono" } as never))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita responsável fora da organização", async () => {
    await expect(callerFor(manager).tasks.create({ title: "X", assigneeId: outsider.id }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita usuário fora da organização", async () => {
    await expect(callerFor(outsider).tasks.create({ title: "X", assigneeId: member.id }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("autorização de leitura", () => {
  it("colaborador não lê tarefa de outra pessoa", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Sigilosa", assigneeId: member.id });
    await expect(callerFor(other).tasks.getById({ id: task.id }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("atribuição e status", () => {
  it("gestor altera responsável e registra evento", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Reatribuir", assigneeId: member.id });
    const updated = await callerFor(manager).tasks.assign({ id: task.id, assigneeId: other.id });
    expect(updated.assigneeId).toBe(other.id);
    const events = await callerFor(manager).tasks.getEvents({ id: task.id });
    expect(events.map((e) => e.eventType)).toContain("reassigned");
  });

  it("colaborador não reatribui", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Minha", assigneeId: member.id });
    await expect(callerFor(member).tasks.assign({ id: task.id, assigneeId: other.id }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("colaborador conclui a própria tarefa (preenche completedAt/By)", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Fazer X", assigneeId: member.id });
    await callerFor(member).tasks.setStatus({ id: task.id, status: "in_progress" });
    const done = await callerFor(member).tasks.setStatus({ id: task.id, status: "completed" });
    expect(done.status).toBe("completed");
    expect(done.completedAt).not.toBeNull();
    expect(done.completedBy).toBe(member.id);
  });

  it("colaborador não arquiva (só gestor/admin)", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Não arquivar", assigneeId: member.id });
    await expect(callerFor(member).tasks.setStatus({ id: task.id, status: "archived" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("concluir duas vezes é idempotente", async () => {
    const task = await callerFor(manager).tasks.create({ title: "2x", assigneeId: member.id });
    await callerFor(member).tasks.setStatus({ id: task.id, status: "completed" });
    const again = await callerFor(member).tasks.setStatus({ id: task.id, status: "completed" });
    expect(again.status).toBe("completed");
  });

  it("reabertura exige motivo e limpa conclusão", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Reabrir", assigneeId: member.id });
    await callerFor(member).tasks.setStatus({ id: task.id, status: "completed" });
    await expect(callerFor(manager).tasks.setStatus({ id: task.id, status: "in_progress" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    const reopened = await callerFor(manager).tasks.reopen({ id: task.id, reason: "Cliente pediu ajuste" });
    expect(reopened.status).toBe("in_progress");
    expect(reopened.completedAt).toBeNull();
  });

  it("transição inválida é rejeitada (completed → todo)", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Inválida", assigneeId: member.id });
    await callerFor(member).tasks.setStatus({ id: task.id, status: "completed" });
    await expect(callerFor(manager).tasks.setStatus({ id: task.id, status: "todo" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("atraso e resumo", () => {
  it("atrasada aparece em overdueOnly; concluída com prazo passado não", async () => {
    const past = new Date(Date.now() - 86400000);
    const late = await callerFor(manager).tasks.create({ title: "Atrasada", assigneeId: member.id, dueAt: past });
    const donePast = await callerFor(manager).tasks.create({ title: "Feita atrasada", assigneeId: member.id, dueAt: past });
    await callerFor(member).tasks.setStatus({ id: donePast.id, status: "completed" });

    const res = await callerFor(manager).tasks.list({ scope: "all", overdueOnly: true, pageSize: 50 });
    const ids = res.items.map((t) => t.id);
    expect(ids).toContain(late.id);
    expect(ids).not.toContain(donePast.id);
  });
});

describe("comentários", () => {
  it("autor comenta e edita; outro membro não edita", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Comentar", assigneeId: member.id });
    const c = await callerFor(member).tasks.addComment({ id: task.id, body: "Indo ao cliente" });
    expect(c.body).toBe("Indo ao cliente");

    const edited = await callerFor(member).tasks.updateComment({ commentId: c.id, body: "Cheguei" });
    expect(edited.body).toBe("Cheguei");

    await expect(callerFor(other).tasks.updateComment({ commentId: c.id, body: "Hack" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("origem (plano2.0 #12)", () => {
  it("persiste a origem informada e aceita ausência", async () => {
    const withOrigin = await callerFor(manager).tasks.create({ title: "Com origem", assigneeId: member.id, origin: "cliente" });
    expect(withOrigin.origin).toBe("cliente");
    const without = await callerFor(manager).tasks.create({ title: "Sem origem", assigneeId: member.id });
    expect(without.origin).toBeNull();
    const updated = await callerFor(manager).tasks.update({ id: without.id, origin: "rotina" });
    expect(updated.origin).toBe("rotina");
  });
});

describe("anexos (Etapa 4)", () => {
  it("responsável anexa evidência: metadados + evento", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Comprovante", assigneeId: member.id });
    const att = await callerFor(member).tasks.addAttachment({
      taskId: task.id,
      fileUrl: "/files/abc123",
      fileName: "comprovante.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(att.fileName).toBe("comprovante.pdf");

    const detail = await callerFor(member).tasks.getById({ id: task.id });
    expect(detail.attachments.map((a) => a.fileName)).toContain("comprovante.pdf");

    const events = await callerFor(manager).tasks.getEvents({ id: task.id });
    expect(events.map((e) => e.eventType)).toContain("attachment_added");
  });

  it("rejeita arquivo grande demais", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Grande", assigneeId: member.id });
    await expect(callerFor(member).tasks.addAttachment({
      taskId: task.id, fileUrl: "/files/x", fileName: "g.bin",
      mimeType: "application/zip", fileSize: 11 * 1024 * 1024,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("membro sem acesso não anexa em tarefa alheia", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Alheia", assigneeId: member.id });
    await expect(callerFor(other).tasks.addAttachment({
      taskId: task.id, fileUrl: "/files/y", fileName: "y.pdf",
      mimeType: "application/pdf", fileSize: 10,
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("cobrança (plano2.0 #11, testes #39)", () => {
  it("gestor cobra: registra evento e notifica o responsável", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Cobrar esta", assigneeId: member.id });
    const res = await callerFor(manager).tasks.sendReminder({ id: task.id });
    expect(res.ok).toBe(true);
    expect(res.to).toBe(member.id);

    const events = await callerFor(manager).tasks.getEvents({ id: task.id });
    expect(events.map((e) => e.eventType)).toContain("reminder");

    const notifs = await callerFor(member).notifications.list({});
    expect(notifs.items.some((n) => n.taskId === task.id && n.type === "reminder_received")).toBe(true);
  });

  it("colaborador não envia cobrança", async () => {
    const task = await callerFor(manager).tasks.create({ title: "Sem cobrança", assigneeId: member.id });
    await expect(callerFor(member).tasks.sendReminder({ id: task.id }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
