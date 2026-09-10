// Procedures de tarefas sobre Postgres+Drizzle — plano.md §9 (Etapa 3).
// Toda operação valida: auth, organização, existência, permissão e pertencimento.
import { TRPCError } from "@trpc/server";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  assignTaskSchema,
  canTransition,
  commentBodySchema,
  createTaskSchema,
  isOverdue,
  listTasksSchema,
  setStatusSchema,
  updateTaskSchema,
  type MemberRole,
} from "@hubagendor/shared";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  clients,
  notifications,
  taskAttachments,
  taskComments,
  taskEvents,
  tasks,
  teamMembers,
  teams,
} from "../../../drizzle/schema.js";
import { getDb, type Db } from "../db.js";
import { logTaskEvent, notifyUser, requireOrgMember } from "../db/helpers.js";
import {
  canArchive,
  canManageTask,
  canReopen,
  canViewAllTasks,
  reopenRequiresReason,
} from "../permissions.js";
import { protectedProcedure, router } from "../trpc.js";
import type { Context } from "../context.js";

type Ctx = { user: NonNullable<Context["user"]> };

async function dbOrThrow(): Promise<Db> {
  const db = getDb();
  if (!db) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Banco indisponível — configure DATABASE_URL" });
  }
  return db;
}

/** Equipes do usuário (para escopo team e visão de líder/colaborador). */
async function userTeamIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, userId));
  return rows.map((r) => r.teamId);
}

/** Tarefa da org ou NOT_FOUND (não vaza existência entre orgs). */
async function getOrgTask(db: Db, orgId: string, id: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, orgId)))
    .limit(1);
  if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
  return task;
}

function assertCanView(role: MemberRole, task: { assigneeId: string; creatorId: string; teamId: string | null }, me: string, myTeams: string[]) {
  if (canViewAllTasks(role)) return;
  if (task.assigneeId === me || task.creatorId === me) return;
  if (task.teamId && myTeams.includes(task.teamId)) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para esta tarefa" });
}

function assertCanManage(role: MemberRole, task: { assigneeId: string; creatorId: string }, me: string) {
  if (!canManageTask(role, { isAssignee: task.assigneeId === me, isCreator: task.creatorId === me })) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para alterar esta tarefa" });
  }
}

/** Garante que team/client pertencem à org (quando informados). */
async function assertBelongsToOrg(db: Db, orgId: string, teamId?: string, clientId?: string) {
  if (teamId) {
    const [t] = await db.select().from(teams).where(and(eq(teams.id, teamId), eq(teams.organizationId, orgId))).limit(1);
    if (!t) throw new TRPCError({ code: "BAD_REQUEST", message: "Equipe não pertence à organização" });
  }
  if (clientId) {
    const [c] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId))).limit(1);
    if (!c) throw new TRPCError({ code: "BAD_REQUEST", message: "Cliente não pertence à organização" });
  }
}

async function assertAssigneeInOrg(db: Db, orgId: string, assigneeId: string) {
  try {
    await requireOrgMember(db, orgId, assigneeId);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "O responsável selecionado não pertence à organização" });
  }
}

type TaskRow = typeof tasks.$inferSelect;

async function enrich(db: Db, rows: TaskRow[]) {
  const clientIds = [...new Set(rows.map((t) => t.clientId).filter((c): c is string => !!c))];
  const nameById = new Map<string, string>();
  if (clientIds.length) {
    const found = await db.select().from(clients).where(inArray(clients.id, clientIds));
    for (const c of found) nameById.set(c.id, c.name);
  }
  return rows.map((t) => ({
    ...t,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    archivedAt: t.archivedAt ? t.archivedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    clientName: t.clientId ? (nameById.get(t.clientId) ?? null) : null,
    overdue: isOverdue({ status: t.status, dueAt: t.dueAt }),
    statusLabel: STATUS_LABEL[t.status],
    priorityLabel: PRIORITY_LABEL[t.priority],
  }));
}

function sortOperational<T extends { status: TaskRow["status"]; dueAt: Date | string | null; updatedAt: Date | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = isOverdue({ status: a.status, dueAt: a.dueAt }) ? 0 : 1;
    const bo = isOverdue({ status: b.status, dueAt: b.dueAt }) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    if (a.dueAt && b.dueAt) return +new Date(a.dueAt) - +new Date(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return +new Date(b.updatedAt) - +new Date(a.updatedAt);
  });
}

export const tasksRouter = router({
  // tasks.list — paginação + filtros (plano.md §9)
  list: protectedProcedure.input(listTasksSchema).query(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const myTeams = await userTeamIds(db, me.id);

    const conds = [eq(tasks.organizationId, me.organizationId)];
    if (input.scope === "mine") {
      conds.push(eq(tasks.assigneeId, me.id));
    } else if (input.scope === "team") {
      const teamIds = input.teamId ? [input.teamId] : myTeams;
      if (teamIds.length === 0) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
      conds.push(inArray(tasks.teamId, teamIds));
    } else if (!canViewAllTasks(me.role)) {
      // Colaborador em "all": próprias + das suas equipes.
      conds.push(
        myTeams.length
          ? or(eq(tasks.assigneeId, me.id), inArray(tasks.teamId, myTeams))!
          : eq(tasks.assigneeId, me.id),
      );
    }
    if (input.status) conds.push(eq(tasks.status, input.status));
    if (input.assigneeId) conds.push(eq(tasks.assigneeId, input.assigneeId));
    if (input.teamId && input.scope !== "team") conds.push(eq(tasks.teamId, input.teamId));
    if (input.clientId) conds.push(eq(tasks.clientId, input.clientId));
    if (input.search) {
      const q = `%${input.search}%`;
      const ors = [ilike(tasks.title, q), ilike(tasks.description, q)];
      const matchedClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.organizationId, me.organizationId), ilike(clients.name, q)));
      if (matchedClients.length) ors.push(inArray(tasks.clientId, matchedClients.map((c) => c.id)));
      conds.push(or(...ors)!);
    }

    const rows = await db.select().from(tasks).where(and(...conds));
    let items = await enrich(db, rows);

    if (input.overdueOnly) items = items.filter((t) => t.overdue);
    if (input.due === "today") {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      items = items.filter((t) => {
        if (!t.dueAt || t.status === "completed" || t.status === "archived") return false;
        const d = new Date(t.dueAt);
        return d >= start && d <= end;
      });
    }
    if (input.due === "none") {
      items = items.filter((t) => !t.dueAt && t.status !== "completed" && t.status !== "archived");
    }

    items = sortOperational(items);
    const total = items.length;
    const startIdx = (input.page - 1) * input.pageSize;
    return { items: items.slice(startIdx, startIdx + input.pageSize), total, page: input.page, pageSize: input.pageSize };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const task = await getOrgTask(db, me.organizationId, input.id);
    assertCanView(me.role, task, me.id, await userTeamIds(db, me.id));

    const comments = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, task.id))
      .orderBy(desc(taskComments.createdAt));
    const attachments = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, task.id))
      .orderBy(desc(taskAttachments.createdAt));
    const [enriched] = await enrich(db, [task]);
    return {
      ...enriched,
      comments: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
      })),
      attachments: attachments.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    };
  }),

  create: protectedProcedure.input(createTaskSchema).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    await assertAssigneeInOrg(db, me.organizationId, input.assigneeId);
    await assertBelongsToOrg(db, me.organizationId, input.teamId, input.clientId);

    const [task] = await db.insert(tasks).values({
      organizationId: me.organizationId,
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      origin: input.origin ?? null,
      assigneeId: input.assigneeId,
      creatorId: me.id,
      teamId: input.teamId,
      clientId: input.clientId,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    }).returning();

    await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "created" });
    if (input.assigneeId !== me.id) {
      await notifyUser(db, {
        organizationId: me.organizationId,
        userId: input.assigneeId,
        type: "task_assigned",
        taskId: task.id,
        title: "Nova tarefa para você",
        body: `${me.name} atribuiu “${task.title}”.`,
      });
    }
    const [enriched] = await enrich(db, [task]);
    return enriched;
  }),

  update: protectedProcedure.input(updateTaskSchema).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const task = await getOrgTask(db, me.organizationId, input.id);
    assertCanManage(me.role, task, me.id);

    const [updated] = await db.update(tasks).set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.origin !== undefined ? { origin: input.origin } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
      updatedAt: new Date(),
    }).where(eq(tasks.id, task.id)).returning();

    await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "updated" });
    const [enriched] = await enrich(db, [updated]);
    return enriched;
  }),

  assign: protectedProcedure.input(assignTaskSchema).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    if (me.role !== "admin" && me.role !== "manager" && me.role !== "leader") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Só gestor, líder ou admin reatribui tarefas" });
    }
    const task = await getOrgTask(db, me.organizationId, input.id);
    await assertAssigneeInOrg(db, me.organizationId, input.assigneeId);

    const from = task.assigneeId;
    const [updated] = await db.update(tasks).set({ assigneeId: input.assigneeId, updatedAt: new Date() })
      .where(eq(tasks.id, task.id)).returning();

    await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "reassigned", metadata: { from, to: input.assigneeId } });
    if (input.assigneeId !== me.id) {
      await notifyUser(db, {
        organizationId: me.organizationId, userId: input.assigneeId, type: "task_reassigned",
        taskId: task.id, title: "Tarefa reatribuída para você", body: `${me.name} atribuiu “${task.title}”.`,
      });
    }
    const [enriched] = await enrich(db, [updated]);
    return enriched;
  }),

  setStatus: protectedProcedure.input(setStatusSchema).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const task = await getOrgTask(db, me.organizationId, input.id);
    assertCanManage(me.role, task, me.id);

    if (!canTransition(task.status, input.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Transição ${task.status} → ${input.status} não permitida` });
    }
    if (input.status === "archived" && !canArchive(me.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Só gestor ou admin arquiva tarefas" });
    }
    if (task.status === "completed" && input.status === "in_progress") {
      if (!canReopen(me.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Só gestor ou líder reabre tarefas" });
      if (reopenRequiresReason(me.role) && !input.reason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reabertura exige motivo" });
      }
    }

    const from = task.status;
    const [updated] = await db.update(tasks).set({
      status: input.status,
      completedAt: input.status === "completed" ? new Date() : from === "completed" ? null : task.completedAt,
      completedBy: input.status === "completed" ? me.id : from === "completed" ? null : task.completedBy,
      archivedAt: input.status === "archived" ? new Date() : task.archivedAt,
      updatedAt: new Date(),
    }).where(eq(tasks.id, task.id)).returning();

    await logTaskEvent(db, {
      taskId: task.id, actorId: me.id, eventType: `status:${from}->${input.status}`,
      metadata: { reason: input.reason ?? null },
    });

    if (input.status === "completed" && task.creatorId !== me.id) {
      await notifyUser(db, {
        organizationId: me.organizationId, userId: task.creatorId, type: "task_completed",
        taskId: task.id, title: "Tarefa concluída", body: `${me.name} concluiu “${task.title}”.`,
      });
    }
    if (from === "completed" && input.status === "in_progress" && task.assigneeId !== me.id) {
      await notifyUser(db, {
        organizationId: me.organizationId, userId: task.assigneeId, type: "task_reopened",
        taskId: task.id, title: "Tarefa reaberta", body: `${me.name} reabriu “${task.title}”. Motivo: ${input.reason}`,
      });
    }
    const [enriched] = await enrich(db, [updated]);
    return enriched;
  }),

  setDueDate: protectedProcedure
    .input(z.object({ id: z.string().uuid(), dueAt: z.coerce.date().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const me = (ctx as Ctx).user;
      await requireOrgMember(db, me.organizationId, me.id);
      const task = await getOrgTask(db, me.organizationId, input.id);
      assertCanManage(me.role, task, me.id);

      const [updated] = await db.update(tasks).set({
        dueAt: input.dueAt ? new Date(input.dueAt) : null, updatedAt: new Date(),
      }).where(eq(tasks.id, task.id)).returning();
      await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "due_changed" });
      const [enriched] = await enrich(db, [updated]);
      return enriched;
    }),

  archive: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    if (!canArchive(me.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Só gestor ou admin arquiva tarefas" });
    const task = await getOrgTask(db, me.organizationId, input.id);

    const [updated] = await db.update(tasks).set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(tasks.id, task.id)).returning();
    await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "status:open->archived" });
    const [enriched] = await enrich(db, [updated]);
    return enriched;
  }),

  reopen: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().trim().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const me = (ctx as Ctx).user;
      await requireOrgMember(db, me.organizationId, me.id);
      if (!canReopen(me.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Só gestor ou líder reabre tarefas" });
      const task = await getOrgTask(db, me.organizationId, input.id);

      const [updated] = await db.update(tasks).set({
        status: "in_progress", completedAt: null, completedBy: null, updatedAt: new Date(),
      }).where(eq(tasks.id, task.id)).returning();
      await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "reopened", metadata: { reason: input.reason } });
      if (task.assigneeId !== me.id) {
        await notifyUser(db, {
          organizationId: me.organizationId, userId: task.assigneeId, type: "task_reopened",
          taskId: task.id, title: "Tarefa reaberta", body: `${me.name} reabriu “${task.title}”. Motivo: ${input.reason}`,
        });
      }
      const [enriched] = await enrich(db, [updated]);
      return enriched;
    }),

  addComment: protectedProcedure
    .input(z.object({ id: z.string().uuid(), body: commentBodySchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const me = (ctx as Ctx).user;
      await requireOrgMember(db, me.organizationId, me.id);
      const task = await getOrgTask(db, me.organizationId, input.id);
      assertCanView(me.role, task, me.id, await userTeamIds(db, me.id));

      const [comment] = await db.insert(taskComments).values({ taskId: task.id, authorId: me.id, body: input.body }).returning();
      await db.update(tasks).set({ updatedAt: new Date() }).where(eq(tasks.id, task.id));
      await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "commented" });
      if (task.assigneeId !== me.id) {
        await notifyUser(db, {
          organizationId: me.organizationId, userId: task.assigneeId, type: "comment_added",
          taskId: task.id, title: "Novo comentário", body: `${me.name} comentou em “${task.title}”.`,
        });
      }
      return { ...comment, createdAt: comment.createdAt.toISOString(), updatedAt: comment.updatedAt ? comment.updatedAt.toISOString() : null };
    }),

  updateComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid(), body: commentBodySchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const me = (ctx as Ctx).user;
      const [comment] = await db.select().from(taskComments).where(eq(taskComments.id, input.commentId)).limit(1);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND", message: "Comentário não encontrado" });
      const task = await getOrgTask(db, me.organizationId, comment.taskId);
      if (comment.authorId !== me.id && me.role !== "admin" && me.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Só o autor pode editar este comentário" });
      }
      const [updated] = await db.update(taskComments).set({ body: input.body, updatedAt: new Date() })
        .where(eq(taskComments.id, comment.id)).returning();
      await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "comment_updated" });
      return updated;
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const me = (ctx as Ctx).user;
      const [comment] = await db.select().from(taskComments).where(eq(taskComments.id, input.commentId)).limit(1);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND", message: "Comentário não encontrado" });
      const task = await getOrgTask(db, me.organizationId, comment.taskId);
      if (comment.authorId !== me.id && me.role !== "admin" && me.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Só o autor pode apagar este comentário" });
      }
      await db.delete(taskComments).where(eq(taskComments.id, comment.id));
      await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "comment_deleted" });
      return { ok: true };
    }),

  // Anexos: binário vai para /uploads (dev) ou object storage (prod);
  // aqui entram só os metadados (plano.md §2).
  addAttachment: protectedProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      fileUrl: z.string().trim().min(1).max(1024),
      fileName: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().min(1).max(128),
      fileSize: z.number().int().min(1).max(10 * 1024 * 1024),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbOrThrow();
      const me = (ctx as Ctx).user;
      await requireOrgMember(db, me.organizationId, me.id);
      const task = await getOrgTask(db, me.organizationId, input.taskId);
      assertCanManage(me.role, task, me.id);

      const [row] = await db.insert(taskAttachments).values({
        taskId: task.id,
        uploadedBy: me.id,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      }).returning();
      await db.update(tasks).set({ updatedAt: new Date() }).where(eq(tasks.id, task.id));
      await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "attachment_added", metadata: { fileName: input.fileName } });
      return { ...row, createdAt: row.createdAt.toISOString() };
    }),

  getEvents: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const task = await getOrgTask(db, me.organizationId, input.id);
    assertCanView(me.role, task, me.id, await userTeamIds(db, me.id));
    const rows = await db.select().from(taskEvents).where(eq(taskEvents.taskId, task.id)).orderBy(desc(taskEvents.createdAt));
    return rows.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }));
  }),

  // tasks.getSummary — cards do painel do gestor (plano.md §6)
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    const myTeams = await userTeamIds(db, me.id);

    const all = await db.select().from(tasks).where(eq(tasks.organizationId, me.organizationId));
    const base = canViewAllTasks(me.role)
      ? all
      : all.filter((t) => t.assigneeId === me.id || (t.teamId && myTeams.includes(t.teamId)));

    const today = new Date(); today.setHours(23, 59, 59, 999);
    const startDay = new Date(); startDay.setHours(0, 0, 0, 0);
    const open = (t: TaskRow) => t.status !== "completed" && t.status !== "archived";
    const overdue = base.filter((t) => isOverdue({ status: t.status, dueAt: t.dueAt }));
    const dueToday = base.filter((t) => {
      if (!t.dueAt || !open(t)) return false;
      const d = new Date(t.dueAt);
      return d >= startDay && d <= today;
    });
    // Sem atualização: em andamento sem atividade há mais de 24h (plano2.0 #5).
    const staleCutoff = new Date(Date.now() - 24 * 3600 * 1000);
    const stale = base.filter((t) => t.status === "in_progress" && new Date(t.updatedAt) < staleCutoff);

    const [overdueItems, dueTodayItems, staleItems] = await Promise.all([
      enrich(db, sortOperational(overdue).slice(0, 5)),
      enrich(db, sortOperational(dueToday).slice(0, 5)),
      enrich(db, sortOperational(stale).slice(0, 5)),
    ]);

    const countable = base.filter((t) => t.status !== "archived");
    const doneCount = countable.filter((t) => t.status === "completed").length;

    return {
      overdue: overdue.length,
      dueToday: dueToday.length,
      inProgress: base.filter((t) => t.status === "in_progress").length,
      completedToday: base.filter((t) => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= startDay).length,
      noDueDate: base.filter((t) => !t.dueAt && open(t)).length,
      stale: stale.length,
      // Taxa de conclusão — plano2.0 #15 (só operação, sem BI).
      completion: {
        rate: countable.length ? Math.round((doneCount / countable.length) * 100) : 0,
        done: doneCount,
        total: countable.length,
      },
      overdueItems,
      dueTodayItems,
      staleItems,
    };
  }),

  sendReminder: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const me = (ctx as Ctx).user;
    await requireOrgMember(db, me.organizationId, me.id);
    if (me.role !== "admin" && me.role !== "manager" && me.role !== "leader") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Só gestor ou líder envia cobranças" });
    }
    const task = await getOrgTask(db, me.organizationId, input.id);

    await logTaskEvent(db, { taskId: task.id, actorId: me.id, eventType: "reminder", metadata: { to: task.assigneeId } });
    await notifyUser(db, {
      organizationId: me.organizationId, userId: task.assigneeId, type: "reminder_received",
      taskId: task.id, title: "Cobrança de atualização", body: `${me.name} pediu atualização em “${task.title}”.`,
    });
    return { ok: true as const, to: task.assigneeId };
  }),

});

// Re-export dos tipos de notificação usados no client (UX §12).
export async function unreadCount(db: Db, userId: string): Promise<number> {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId)));
  return rows.filter((n) => !n.readAt).length;
}
