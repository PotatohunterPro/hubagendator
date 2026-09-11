// Job periódico: gera notificações de "vence hoje" e "atrasada" (plano2.0 §21).
// Idempotente por dia: não repete a mesma notificação para a mesma tarefa.
import { and, eq, gte, inArray } from "drizzle-orm";
import { notifications, tasks } from "../../../drizzle/schema.js";
import type { Db } from "../db.js";
import { getDb } from "../db.js";
import { notifyUser } from "../db/helpers.js";

const RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export async function runDueNotifications(db: Db, now = new Date()): Promise<number> {
  const startDay = new Date(now);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(now);
  endDay.setHours(23, 59, 59, 999);

  const open = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.status, ["todo", "in_progress"]));

  let created = 0;
  for (const t of open) {
    if (!t.dueAt) continue;
    const due = new Date(t.dueAt);
    const isOverdue = due < now;
    const isDueToday = !isOverdue && due >= startDay && due <= endDay;
    if (!isOverdue && !isDueToday) continue;

    const type = isOverdue ? "task_overdue" : "task_due_today";
    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, t.assigneeId),
          eq(notifications.taskId, t.id),
          eq(notifications.type, type),
          gte(notifications.createdAt, startDay),
        ),
      )
      .limit(1);
    if (existing) continue;

    await notifyUser(db, {
      organizationId: t.organizationId,
      userId: t.assigneeId,
      type,
      taskId: t.id,
      title: isOverdue ? "Tarefa atrasada" : "Tarefa vence hoje",
      body: isOverdue ? `“${t.title}” está atrasada.` : `“${t.title}” vence hoje.`,
    });
    created += 1;
  }
  return created;
}

/** Inicia o job (roda no boot e a cada 5 min). */
export function startNotificationScheduler(): NodeJS.Timeout {
  const run = async () => {
    const db = getDb();
    if (!db) return;
    try {
      const n = await runDueNotifications(db);
      if (n > 0) console.log(`[jobs] ${n} notificação(ões) de prazo geradas`);
    } catch (err) {
      console.error("[jobs] falha ao gerar notificações de prazo", err);
    }
  };
  void run();
  const timer = setInterval(run, RUN_INTERVAL_MS);
  timer.unref?.();
  return timer;
}
