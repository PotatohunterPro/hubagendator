import { Link } from "react-router-dom";
import { Bell, Check, CircleAlert, Clock3, Plus } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@hubagendor/shared";
import { PRIORITY_LABEL, STATUS_LABEL } from "@hubagendor/shared";

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[.08em] text-secondary">{eyebrow}</p>}
        <h1 className="text-[22px] font-semibold leading-7 tracking-[-.015em] text-on-surface">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] leading-[18px] text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-primary-container text-on-primary hover:bg-primary",
    secondary: "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low hover:border-outline",
    ghost: "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
    danger: "bg-error text-on-error hover:bg-on-error-container",
  } as const;
  return (
    <button
      {...props}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status, label, showDot = false }: { status: TaskStatus; label?: string; showDot?: boolean }) {
  const completed = status === "completed";
  const critical = status === "archived";
  const classes = completed
    ? "bg-secondary-fixed/85 text-on-secondary-fixed line-through"
    : critical
      ? "bg-error-container text-on-error-container"
      : "bg-primary-fixed text-on-primary-fixed";
  return (
    <span className={`inline-flex h-5 items-center gap-1 rounded px-2 text-[11px] font-semibold uppercase tracking-[.03em] ${classes}`}>
      {showDot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <StatusBadge status={status} />;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const critical = priority === "urgent" || priority === "high";
  return (
    <span className={`inline-flex h-5 items-center rounded px-2 text-[11px] font-semibold uppercase tracking-[.03em] ${critical ? "bg-error-container text-on-error-container" : "bg-surface-container text-on-surface-variant"}`}>
      {PRIORITY_LABEL[priority]}{critical ? " Prioridade" : ""}
    </span>
  );
}

export function AssigneeAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      title={name}
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-primary-fixed text-[10px] font-bold text-on-primary-fixed"
    >
      {initials}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  supportText,
  icon: Icon,
  tone = "active",
  onClick,
  to,
}: {
  label: string;
  value: number | string;
  supportText?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "critical" | "active" | "completed" | "neutral";
  onClick?: () => void;
  to?: string;
}) {
  const classes = tone === "critical"
    ? "border-error-container bg-error-container/45"
    : tone === "completed"
      ? "border-secondary-fixed bg-secondary-fixed/85"
      : tone === "active"
        ? "border-primary-fixed bg-primary-fixed/65"
        : "border-outline-variant bg-surface-container-lowest";
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.05em] text-on-surface-variant">{label}</span>
        {Icon && <Icon size={16} className="text-primary" />}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-9 tracking-[-.02em] text-on-surface tnum">{value}</p>
      {supportText && <p className="mt-0.5 text-[12px] leading-4 text-on-surface-variant">{supportText}</p>}
    </>
  );
  const cls = `block rounded-lg border p-3 shadow-tier-1 transition hover:shadow-tier-2 ${classes}`;
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  if (onClick) return <button onClick={onClick} className={`w-full text-left ${cls}`}>{content}</button>;
  return <div className={cls}>{content}</div>;
}

export function StatCard(props: {
  label: string;
  value: number;
  to: string;
  tone?: "danger" | "attention" | "info" | "success" | "neutral";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
}) {
  const tone = props.tone === "danger" ? "critical" : props.tone === "success" ? "completed" : props.tone === "neutral" ? "neutral" : "active";
  return <MetricCard {...props} tone={tone} supportText={props.hint} />;
}

export function FilterPill({ label, count, active, onClick }: { label: string; count?: number; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${active ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"}`}>
      {label}{count !== undefined && <span className="tnum opacity-75">{count}</span>}
    </button>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center shadow-tier-1">
      <Check size={22} className="mx-auto mb-2 text-secondary" />
      <p className="font-semibold text-on-surface">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-on-surface-variant">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return <div role="status" aria-label={label} className="space-y-3"><div className="skeleton h-24 w-full" /><div className="skeleton h-24 w-full" /><div className="skeleton h-24 w-2/3" /></div>;
}

export function MetricSkeleton() {
  return <div role="status" aria-label="Carregando indicadores" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full" />)}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-lg border border-error-container bg-error-container/45 p-4 text-[13px] text-on-error-container"><div className="flex items-start gap-2"><CircleAlert size={18} /><p>{message}</p></div>{onRetry && <button onClick={onRetry} className="mt-2 font-semibold underline">Tentar de novo</button>}</div>;
}

export function OperationalFormSection({ title, helper, children }: { title: string; helper?: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-tier-1"><h2 className="text-[15px] font-semibold text-on-surface">{title}</h2>{helper && <p className="mt-1 text-[12px] text-on-surface-variant">{helper}</p>}<div className="mt-3">{children}</div></section>;
}

export function FloatingNewTaskButton() {
  return <Link to="/app/tasks/new" className="fixed bottom-20 right-4 z-30 inline-flex h-11 items-center gap-2 rounded-full bg-primary-container px-4 text-[13px] font-semibold text-on-primary shadow-tier-2 md:hidden"><Plus size={18} /> Nova Tarefa</Link>;
}

export function AppHeader({ unread = 0 }: { unread?: number }) {
  return <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-secondary">Ação Imediata</p><p className="text-[12px] text-on-surface-variant">Plantão Ativo · Ao Vivo</p></div><Link to="/app/notifications" className="relative grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"><Bell size={19} />{unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">{unread}</span>}</Link></div>;
}

export function BackHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return <div className="mb-5 flex items-center gap-3">{onBack ? <button className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container" onClick={onBack} aria-label="Voltar">←</button> : null}<h1 className="text-[22px] font-semibold">{title}</h1></div>;
}

export function DueLabel({ value, overdue = false }: { value: string | null; overdue?: boolean }) {
  return <span className={`flex items-center gap-1 text-[12px] tnum ${overdue ? "font-semibold text-error" : "text-on-surface-variant"}`}><Clock3 size={14} />{value ?? "Sem prazo"}</span>;
}
