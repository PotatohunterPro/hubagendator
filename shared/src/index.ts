// Tipos + regras compartilhadas frontend/backend — plano.md §7, §8, §9.
// Fonte única de verdade para status, prioridade, papéis e transições.

import { z } from "zod";

export const memberRoles = ["admin", "manager", "leader", "member"] as const;
export type MemberRole = (typeof memberRoles)[number];

export const taskStatuses = ["todo", "in_progress", "completed", "archived"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

// Origem do trabalho — plano2.0 #12. Campo simples, sem relatório no MVP.
export const taskOrigins = ["gestor", "rotina", "cliente", "comercial", "interna"] as const;
export type TaskOrigin = (typeof taskOrigins)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  completed: "Concluída",
  archived: "Arquivada",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const ORIGIN_LABEL: Record<TaskOrigin, string> = {
  gestor: "Gestor",
  rotina: "Rotina",
  cliente: "Cliente",
  comercial: "Comercial",
  interna: "Interna",
};

// --- Regra de atraso (plano.md §7): sem status `overdue` separado ---------
export function isOverdue(args: {
  status: TaskStatus;
  dueAt: Date | string | null | undefined;
  now?: Date;
}): boolean {
  const { status, dueAt, now = new Date() } = args;
  if (status === "completed" || status === "archived") return false;
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < now.getTime();
}

// --- Transições permitidas (plano.md §7) -----------------------------------
// Matriz pura (sem papel). O papel é checado no backend em permissions.ts.
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress", "completed", "archived"],
  in_progress: ["completed", "archived", "todo"],
  completed: ["in_progress", "archived"],
  archived: ["in_progress"],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true; // idempotente (concluir 2x não quebra)
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// --- Zod: validação de entrada (plano.md §9) --------------------------------

export const titleSchema = z.string().trim().min(1, "Título é obrigatório").max(200);
export const descriptionSchema = z.string().trim().max(5000).optional().default("");
export const commentBodySchema = z.string().trim().min(1, "Comentário vazio").max(2000);

// --- Agendamento (Agenda v1) ------------------------------------------------
// `isScheduled` é calculado: ambos os horários preenchidos.
export function isScheduled(t: { scheduledStart?: Date | string | null; scheduledEnd?: Date | string | null }): boolean {
  return Boolean(t.scheduledStart && t.scheduledEnd);
}

const MAX_SCHEDULE_MS = 24 * 3600 * 1000;

function refineSchedule(
  data: { scheduledStart?: Date | null; scheduledEnd?: Date | null },
  ctx: z.RefinementCtx,
): void {
  const start = data.scheduledStart ?? null;
  const end = data.scheduledEnd ?? null;
  if (!start && !end) return; // sem horário é válido
  if (!start || !end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledEnd"], message: "Informe início e fim juntos" });
    return;
  }
  if (end.getTime() <= start.getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledEnd"], message: "O fim deve ser posterior ao início" });
    return;
  }
  if (end.getTime() - start.getTime() > MAX_SCHEDULE_MS) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledEnd"], message: "Duração máxima de 24 horas" });
  }
}

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  priority: z.enum(taskPriorities).default("normal"),
  origin: z.enum(taskOrigins).optional(),
  assigneeId: z.string().min(1, "Responsável é obrigatório"),
  teamId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  dueAt: z.coerce.date().optional(),
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional(),
  location: z.string().trim().max(255).optional(),
}).superRefine(refineSchedule);

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: titleSchema.optional(),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(taskPriorities).optional(),
  origin: z.enum(taskOrigins).nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
  scheduledStart: z.coerce.date().nullable().optional(),
  scheduledEnd: z.coerce.date().nullable().optional(),
  location: z.string().trim().max(255).nullable().optional(),
});

export const setScheduleSchema = z.object({
  id: z.string().uuid(),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  location: z.string().trim().max(255).nullable().optional(),
}).superRefine(refineSchedule);

export const clearScheduleSchema = z.object({
  id: z.string().uuid(),
  clearLocation: z.boolean().default(false),
});

export const agendaSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  scope: z.enum(["mine", "all", "team"]).default("all"),
  assigneeId: z.string().optional(),
  teamId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  onlyConflicts: z.boolean().default(false),
});

export const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(taskStatuses),
  reason: z.string().trim().max(500).optional(),
});

export const assignTaskSchema = z.object({
  id: z.string().uuid(),
  assigneeId: z.string().min(1),
});

export const listTasksSchema = z.object({
  scope: z.enum(["mine", "all", "team"]).default("mine"),
  status: z.enum(taskStatuses).optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  overdueOnly: z.boolean().default(false),
  due: z.enum(["today", "none"]).optional(),
  search: z.string().trim().max(120).default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;

// --- Auth / membros (uso interno: nome + senha) -----------------------------

export const loginSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(160),
  password: z.string().min(1, "Informe a senha").max(128),
});

export const createMemberSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  password: z.string().min(4, "Senha mínima de 4 caracteres").max(128),
  role: z.enum(memberRoles),
  email: z.string().trim().email().max(255).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

// Presentation entities shared by the Material component library.  The API
// adapters can map persistence rows to these stable shapes without leaking
// database-specific names into the screens.
export type TaskCategory = "critical" | "no_update" | "today" | "unassigned" | "completed";

export interface Technician {
  id: string;
  name: string;
  role: string;
  team: string | null;
  avatarUrl: string | null;
  activeTaskCount: number;
  inProgressCount: number;
  overdueCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
  currentTask: TaskSummary | null;
  workloadStatus: "high" | "balanced" | "attention" | null;
}

export interface Client {
  id: string;
  name: string;
  location: string | null;
}

export interface TaskSummary {
  id: string;
  title: string;
  client: Client | null;
  assignee: Technician | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  lastUpdatedAt: string | null;
  lastUpdatedBy: Technician | null;
  lastUpdateText: string | null;
  description: string | null;
  category: TaskCategory;
  orderId: string | null;
}

export interface Task extends TaskSummary {
  creator: Technician | null;
  team: string | null;
  origin: TaskOrigin | null;
  completedAt: string | null;
  completedBy: Technician | null;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  events: TaskEvent[];
}

export interface TaskComment {
  id: string;
  author: Technician;
  body: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: Technician;
  createdAt: string;
}

export interface TaskEvent {
  id: string;
  actor: Technician | null;
  eventType: string;
  createdAt: string;
  oldValue: unknown;
  newValue: unknown;
}

export type NotificationType =
  | "overdue"
  | "update_requested"
  | "task_assigned"
  | "task_completed"
  | "comment_added"
  | "support_assigned";

export interface NotificationAction {
  label: string;
  action: "remind" | "view_task" | "reply" | "start_task" | "examine" | "reply_comment" | "view_route";
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  task: TaskSummary | null;
  createdAt: string;
  readAt: string | null;
  unread: boolean;
  actions: NotificationAction[];
}
