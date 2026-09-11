// Testes da Agenda v1 (agendamento de tarefas, conflitos, filtros e auditoria).
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq } from "drizzle-orm";
import { organizationMembers, organizations, taskEvents, tasks, users } from "../../../drizzle/schema.js";
import { appRouter } from "./index.js";
import type { SessionUser } from "../context.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const runId = randomUUID().slice(0, 8);
const orgId = randomUUID();
const otherOrgId = randomUUID();
const managerId = `cal-${runId}-mgr`;
const memberId = `cal-${runId}-mem`;

const manager: SessionUser = { id: managerId, name: "Gestor Cal", organizationId: orgId, role: "manager" };
const member: SessionUser = { id: memberId, name: "Colab Cal", organizationId: orgId, role: "member" };
const caller = () => appRouter.createCaller({ user: manager });
const asMember = () => appRouter.createCaller({ user: member });

const D = (s: string) => new Date(s);

beforeAll(async () => {
  await db.insert(organizations).values([{ id: orgId, name: "Org cal" }, { id: otherOrgId, name: "Outra org" }]);
  await db.insert(users).values([
    { id: managerId, name: "Gestor Cal" },
    { id: memberId, name: "Colab Cal" },
  ]);
  await db.insert(organizationMembers).values([
    { organizationId: orgId, userId: managerId, role: "manager" },
    { organizationId: orgId, userId: memberId, role: "member" },
  ]);
});

afterAll(async () => {
  await db.delete(taskEvents).where(eq(taskEvents.actorId, managerId));
  await db.delete(tasks).where(eq(tasks.organizationId, orgId));
  await db.delete(tasks).where(eq(tasks.organizationId, otherOrgId));
  await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgId));
  await db.delete(users).where(and(eq(users.id, managerId)));
  await db.delete(users).where(and(eq(users.id, memberId)));
  await db.delete(organizations).where(eq(organizations.id, orgId));
  await db.delete(organizations).where(eq(organizations.id, otherOrgId));
  await pool.end();
});

describe("agendamento na criação", () => {
  it("cria tarefa com horário e local (isScheduled)", async () => {
    const t = await caller().tasks.create({
      title: "Venda porta a porta",
      assigneeId: memberId,
      scheduledStart: D("2026-09-12T10:00:00-03:00"),
      scheduledEnd: D("2026-09-12T13:00:00-03:00"),
      location: "Bairro Y",
    });
    expect(t.scheduledStart).not.toBeNull();
    expect(t.scheduledEnd).not.toBeNull();
    expect(t.location).toBe("Bairro Y");

    const events = await caller().tasks.getEvents({ id: t.id });
    expect(events.map((e) => e.eventType)).toContain("scheduled");
  });

  it("cria tarefa sem horário (apenas prazo)", async () => {
    const t = await caller().tasks.create({ title: "Revisar documentos", assigneeId: memberId, dueAt: D("2026-09-12T17:00:00-03:00") });
    expect(t.scheduledStart).toBeNull();
    expect(t.scheduledEnd).toBeNull();
  });

  it("rejeita início sem fim", async () => {
    await expect(caller().tasks.create({
      title: "Só início", assigneeId: memberId, scheduledStart: D("2026-09-12T10:00:00-03:00"),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita fim anterior ao início", async () => {
    await expect(caller().tasks.create({
      title: "Fim antes", assigneeId: memberId,
      scheduledStart: D("2026-09-12T13:00:00-03:00"), scheduledEnd: D("2026-09-12T10:00:00-03:00"),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita duração maior que 24h", async () => {
    await expect(caller().tasks.create({
      title: "Longa", assigneeId: memberId,
      scheduledStart: D("2026-09-12T10:00:00-03:00"), scheduledEnd: D("2026-09-14T10:00:00-03:00"),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("setSchedule / clearSchedule", () => {
  it("altera o horário e registra auditoria", async () => {
    const t = await caller().tasks.create({ title: "Reagendar", assigneeId: memberId });
    const upd = await caller().tasks.setSchedule({
      id: t.id, scheduledStart: D("2026-09-12T14:00:00-03:00"), scheduledEnd: D("2026-09-12T17:00:00-03:00"), location: "Bairro Z",
    });
    expect(upd.scheduledStart).not.toBeNull();
    expect(new Date(upd.scheduledEnd!).getTime() - new Date(upd.scheduledStart!).getTime()).toBe(3 * 3600 * 1000);
    const events = await caller().tasks.getEvents({ id: t.id });
    const ev = events.find((e) => e.eventType === "schedule_changed");
    expect(ev).toBeTruthy();
    expect(ev?.newValue).toBeTruthy();
  });

  it("remove agendamento e preserva local, salvo clearLocation", async () => {
    const t = await caller().tasks.create({
      title: "Limpar", assigneeId: memberId,
      scheduledStart: D("2026-09-12T10:00:00-03:00"), scheduledEnd: D("2026-09-12T11:00:00-03:00"), location: "Sede",
    });
    const cleared = await caller().tasks.clearSchedule({ id: t.id, clearLocation: false });
    expect(cleared.scheduledStart).toBeNull();
    expect(cleared.location).toBe("Sede");
    const cleared2 = await caller().tasks.clearSchedule({ id: t.id, clearLocation: true });
    expect(cleared2.location).toBeNull();
  });

  it("colaborador não altera horário de tarefa alheia", async () => {
    const t = await caller().tasks.create({ title: "Do gestor", assigneeId: managerId });
    await expect(asMember().tasks.setSchedule({
      id: t.id, scheduledStart: D("2026-09-12T10:00:00-03:00"), scheduledEnd: D("2026-09-12T11:00:00-03:00"),
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("conflitos de horário", () => {
  it("detecta sobreposição do mesmo responsável e ignora concluídas", async () => {
    const a = await caller().tasks.create({
      title: "Conflito A", assigneeId: memberId,
      scheduledStart: D("2026-09-20T10:30:00-03:00"), scheduledEnd: D("2026-09-20T12:00:00-03:00"),
    });
    const conflicts = await caller().tasks.checkConflict({
      assigneeId: memberId, scheduledStart: D("2026-09-20T10:00:00-03:00"), scheduledEnd: D("2026-09-20T11:00:00-03:00"),
    });
    expect(conflicts.map((c) => c.id)).toContain(a.id);

    await caller().tasks.setStatus({ id: a.id, status: "completed" });
    const after = await caller().tasks.checkConflict({
      assigneeId: memberId, scheduledStart: D("2026-09-20T10:00:00-03:00"), scheduledEnd: D("2026-09-20T11:00:00-03:00"),
    });
    expect(after.map((c) => c.id)).not.toContain(a.id);
  });

  it("não considera conflito com a própria tarefa", async () => {
    const t = await caller().tasks.create({
      title: "Auto", assigneeId: memberId,
      scheduledStart: D("2026-09-21T09:00:00-03:00"), scheduledEnd: D("2026-09-21T10:00:00-03:00"),
    });
    const conflicts = await caller().tasks.checkConflict({
      assigneeId: memberId, scheduledStart: D("2026-09-21T09:00:00-03:00"), scheduledEnd: D("2026-09-21T10:00:00-03:00"), excludeTaskId: t.id,
    });
    expect(conflicts).toHaveLength(0);
  });
});

describe("agenda (dia) e isolamento", () => {
  it("retorna tarefas agendadas no dia e pendências sem horário", async () => {
    const day = "2026-10-05";
    await caller().tasks.create({
      title: "Agendada do dia", assigneeId: memberId,
      scheduledStart: D(`${day}T09:00:00-03:00`), scheduledEnd: D(`${day}T10:00:00-03:00`),
    });
    await caller().tasks.create({ title: "Sem horário do dia", assigneeId: memberId, dueAt: D(`${day}T18:00:00-03:00`) });

    const res = await caller().tasks.agenda({
      from: D(`${day}T00:00:00-03:00`), to: D(`2026-10-06T00:00:00-03:00`), scope: "all",
    });
    expect(res.scheduled.some((t) => t.title === "Agendada do dia")).toBe(true);
    expect(res.unscheduled.some((t) => t.title === "Sem horário do dia")).toBe(true);
  });

  it("não vaza tarefas de outra organização", async () => {
    const res = await caller().tasks.agenda({ from: D("2026-10-05T00:00:00-03:00"), to: D("2026-10-06T00:00:00-03:00"), scope: "all" });
    expect(res.scheduled.every((t) => t.organizationId === orgId)).toBe(true);
  });
});
