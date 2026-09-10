import { Link } from "react-router-dom";
import type { TaskPriority, TaskStatus } from "@hubagendor/shared";
import { PRIORITY_LABEL, STATUS_LABEL } from "@hubagendor/shared";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* Chips semânticos — texto + cor, nunca só cor (ux-teste DESIGN.md). */
const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600 border-slate-200",
  in_progress: "bg-info-100 text-info-800 border-info-200",
  completed: "bg-success-100 text-success-800 border-success-200",
  archived: "bg-slate-100 text-slate-400 border-slate-200",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-500 border-slate-200",
  normal: "bg-slate-100 text-slate-600 border-slate-200",
  high: "bg-attention-100 text-attention-800 border-attention-200",
  urgent: "bg-danger-100 text-danger-800 border-danger-200",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLE[priority]}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function AssigneeAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      title={name}
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-accent-700 text-[10px] font-bold text-white"
    >
      {initials}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-white p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2.5">
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-2/3" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div role="status" aria-label="Carregando indicadores" className="flex gap-2 overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-[84px] w-28 shrink-0" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-800">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-semibold underline">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Indicador compacto horizontal — ux-teste "Operational Stat Cards". */
export function StatCard({
  label,
  value,
  to,
  tone = "neutral",
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  to: string;
  tone?: "danger" | "attention" | "info" | "success" | "neutral";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
}) {
  const tones = {
    danger: "bg-danger-50 text-danger-800 border-danger-200",
    attention: "bg-attention-50 text-attention-800 border-attention-200",
    info: "bg-info-50 text-info-800 border-info-200",
    success: "bg-success-50 text-success-800 border-success-200",
    neutral: "bg-white text-slate-800 border-line",
  } as const;
  const valueTone =
    tone === "danger" && value > 0 ? "text-danger-700" : tone === "attention" && value > 0 ? "text-attention-700" : "";
  return (
    <Link
      to={to}
      className={`flex w-28 shrink-0 flex-col rounded-xl border p-2.5 shadow-sm transition active:scale-95 ${tones[tone]}`}
    >
      <span className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {Icon && <Icon size={15} className="opacity-80" />}
      </span>
      <span className={`mt-1 text-2xl font-semibold tnum ${valueTone}`}>{value}</span>
      {hint && <span className="text-[10px] opacity-80">{hint}</span>}
    </Link>
  );
}
