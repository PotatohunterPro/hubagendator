// Permissões por papel — plano.md §10. Regra inicial simples e documentada.
import type { MemberRole, TaskStatus } from "@hubagendor/shared";

export function canViewAllTasks(role: MemberRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageTask(
  role: MemberRole,
  opts: { isAssignee: boolean; isCreator: boolean },
): boolean {
  if (role === "admin" || role === "manager") return true;
  if (role === "leader") return true; // refinado na Etapa 3 (escopo por equipe)
  return opts.isAssignee || opts.isCreator;
}

export function canArchive(role: MemberRole): boolean {
  return role === "admin" || role === "manager";
}

export function canReopen(role: MemberRole): boolean {
  return role === "admin" || role === "manager" || role === "leader";
}

export function reopenRequiresReason(role: MemberRole): boolean {
  return role === "manager" || role === "leader";
}

export function assertStatusPermission(role: MemberRole, to: TaskStatus): void {
  if ((to === "archived" && !canArchive(role)) || (to === "in_progress" && false)) return;
}
