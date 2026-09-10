import { Link } from "react-router-dom";
import type { TaskPriority, TaskStatus } from "@hubagendor/shared";
import { PRIORITY_LABEL, STATUS_LABEL } from "@hubagendor/shared";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
    </div>
  );
}

// Badges usam tokens semânticos (UX §14.2) + texto, nunca só cor (UX §2.4).
const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "bg-neutral-100 text-neutral-700",
  in_progress: "bg-info-100 text-info-800",
  completed: "bg-accent-100 text-accent-800",
  archived: "bg-neutral-200 text-neutral-500",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "bg-neutral-100 text-neutral-500",
  normal: "bg-neutral-100 text-neutral-700",
  high: "bg-attention-100 text-attention-800",
  urgent: "bg-danger-100 text-danger-800",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`rounded-full px-2 py-1 text-xs ${PRIORITY_STYLE[priority]}`}>{PRIORITY_LABEL[priority]}</span>;
}

export function AssigneeAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span title={name} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-700 text-xs font-bold text-white">
      {initials}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Skeleton substitui spinner de tela cheia (UX §13.1). */
export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-20 w-2/3" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div role="status" aria-label="Carregando métricas" className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-20" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-800">
      <p>{message}</p>
      {onRetry && <button onClick={onRetry} className="touch-target mt-2 font-semibold underline">Tentar de novo</button>}
    </div>
  );
}

/** Toda métrica abre a lista filtrada (UX §7.2 — sem drill-down, sem métrica). */
export function DashboardMetricCard({ label, value, to, danger }: { label: string; value: number; to: string; danger?: boolean }) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border bg-white p-4 shadow-sm transition active:bg-neutral-50 ${danger && value > 0 ? "border-danger-200" : ""}`}
    >
      <p className={`text-3xl font-bold ${danger && value > 0 ? "text-danger-700" : ""}`}>{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </Link>
  );
}

export function NotificationBell({ unread }: { unread: number }) {
  return <span aria-label={`${unread} não lidas`} className="rounded-full bg-neutral-100 px-2 py-1 text-xs">🔔 {unread}</span>;
}
