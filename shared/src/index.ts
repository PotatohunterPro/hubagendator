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

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  priority: z.enum(taskPriorities).default("normal"),
  origin: z.enum(taskOrigins).optional(),
  assigneeId: z.string().min(1, "Responsável é obrigatório"),
  teamId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  dueAt: z.coerce.date().optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: titleSchema.optional(),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(taskPriorities).optional(),
  origin: z.enum(taskOrigins).nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
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
