// Testes do job de notificações de prazo (vencendo hoje / atrasada).
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq, inArray } from "drizzle-orm";
import { notifications, organizationMembers, organizations, tasks, users } from "../../../drizzle/schema.js";
import * as schema from "../../../drizzle/schema.js";
import { runDueNotifications } from "./dueNotifications.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const runId = randomUUID().slice(0, 8);
const orgId = randomUUID();
const userId = `job-${runId}`;
const taskOverdue = randomUUID();
const taskToday = randomUUID();
const taskDone = randomUUID();

const now = new Date();
const yesterday = new Date(now.getTime() - 26 * 3600 * 1000);
const laterToday = new Date(now.getTime() + 2 * 3600 * 1000);

beforeAll(async () => {
  await db.insert(organizations).values({ id: orgId, name: "Org job" });
  await db.insert(users).values({ id: userId, name: `Job ${runId}` });
  await db.insert(organizationMembers).values({ organizationId: orgId, userId, role: "member" });
  await db.insert(tasks).values([
    { id: taskOverdue, organizationId: orgId, title: "Atrasada", assigneeId: userId, creatorId: userId, status: "todo", dueAt: yesterday },
    { id: taskToday, organizationId: orgId, title: "Vence hoje", assigneeId: userId, creatorId: userId, status: "in_progress", dueAt: laterToday },
    { id: taskDone, organizationId: orgId, title: "Concluída", assigneeId: userId, creatorId: userId, status: "completed", dueAt: yesterday },
  ]);
});

afterAll(async () => {
  await db.delete(notifications).where(eq(notifications.organizationId, orgId));
  await db.delete(tasks).where(eq(tasks.organizationId, orgId));
  await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgId));
  await db.delete(users).where(eq(users.id, userId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
  await pool.end();
});

describe("runDueNotifications", () => {
  it("gera notificações de atrasada e vence hoje, e é idempotente no mesmo dia", async () => {
    await runDueNotifications(db, now);

    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), inArray(notifications.taskId, [taskOverdue, taskToday, taskDone])));
    const byTask = new Map(rows.map((r) => [r.taskId, r]));
    expect(byTask.get(taskOverdue)?.type).toBe("task_overdue");
    expect(byTask.get(taskToday)?.type).toBe("task_due_today");
    expect(byTask.has(taskDone)).toBe(false); // concluída não notifica

    const before = rows.length;
    await runDueNotifications(db, now);
    const after = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), inArray(notifications.taskId, [taskOverdue, taskToday, taskDone])));
    expect(after.length).toBe(before); // não duplica
  });
});
