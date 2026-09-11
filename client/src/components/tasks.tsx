import { Link } from "react-router-dom";
import { Clock, Paperclip, TriangleAlert } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@hubagendor/shared";
import { dueLabel, formatDateTime, isDueToday, userName } from "../lib/format.js";
import { AssigneeAvatar, PriorityBadge, TaskStatusBadge } from "./ui.js";

export interface TaskListItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  clientName?: string | null;
  dueAt: string | null;
  overdue?: boolean;
}

/** Barra lateral semântica de 4px — ux-teste "Schedule Card". */
function edgeColor(task: TaskListItem): string {
  if (task.overdue) return "bg-error";
  if (task.status === "completed") return "bg-success-600";
  if (task.status === "archived") return "bg-outline-variant";
  if (task.dueAt && isDueToday(task.dueAt)) return "bg-attention-200";
  if (task.status === "in_progress") return "bg-primary";
  return "bg-outline-variant";
}

export function TaskCard({ task, onRemind }: { task: TaskListItem; onRemind?: (id: string) => void }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-tier-1 transition hover:shadow-tier-2">
      <span className={`absolute inset-y-0 left-0 w-1 ${edgeColor(task)}`} aria-hidden />
      <Link to={`/app/tasks/${task.id}`} className="block p-3 pl-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {task.overdue && (
            <span className="inline-flex items-center gap-1 rounded border border-error-container bg-error-container px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-error-container">
              <TriangleAlert size={12} /> Atrasada
            </span>
          )}
          <TaskStatusBadge status={task.status} />
          {(task.priority === "high" || task.priority === "urgent") && <PriorityBadge priority={task.priority} />}
        </div>
        <h3 className="mt-1.5 line-clamp-2 font-semibold leading-snug text-on-surface">{task.title}</h3>
        {task.description && <p className="mt-0.5 line-clamp-1 text-[12px] text-on-surface-variant">{task.description}</p>}
        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-on-surface-variant">
          <span className="flex min-w-0 items-center gap-1.5">
            <AssigneeAvatar name={userName(task.assigneeId)} size={22} />
            <span className="truncate font-medium text-on-surface">{userName(task.assigneeId)}</span>
            {task.clientName && <span className="truncate text-on-surface-variant">· {task.clientName}</span>}
          </span>
          <span className={`flex shrink-0 items-center gap-1 tnum ${task.overdue ? "font-bold text-error" : ""}`}>
            <Clock size={13} />
            {dueLabel(task.dueAt, task.overdue ?? false)}
          </span>
        </div>
      </Link>
      {onRemind && task.status !== "completed" && task.status !== "archived" && (
        <div className="hidden gap-2 border-t border-outline-variant px-3 py-2 md:flex">
          <button
            onClick={() => onRemind(task.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-error-container px-3 py-1.5 text-xs font-semibold text-on-error-container hover:border-error-container"
          >
            <TriangleAlert size={14} /> Cobrar atualização
          </button>
          <Link to={`/app/tasks/${task.id}`} className="rounded-md bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high">
            Detalhes
          </Link>
        </div>
      )}
    </div>
  );
}

export function TaskList({ tasks, onRemind }: { tasks: TaskListItem[]; onRemind?: (id: string) => void }) {
  if (!tasks.length) return null;
  return (
    <ul className="space-y-2.5">
      {tasks.map((t) => (
        <li key={t.id}>
          <TaskCard task={t} onRemind={onRemind} />
        </li>
      ))}
    </ul>
  );
}

export interface TaskFilterValue {
  search: string;
  overdueOnly: boolean;
  status: "" | TaskStatus;
}

export const EMPTY_FILTERS: TaskFilterValue = { search: "", overdueOnly: false, status: "" };

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar nas minhas tarefas..."
        aria-label="Buscar tarefas"
        className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-3 pr-3 text-sm shadow-sm outline-none focus:border-primary"
      />
    </div>
  );
}

/** Pills de filtro com rolagem horizontal — ux-teste painel/minhas tarefas. */
export function TaskFilters({
  value,
  onChange,
  counts,
}: {
  value: TaskFilterValue;
  onChange: (v: TaskFilterValue) => void;
  counts?: { overdue: number; inProgress: number; completed: number };
}) {
  const pill = (active: boolean) =>
    `flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${active ? "border-primary-container bg-primary-container text-on-primary shadow-sm" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`;
  const active = (value.search ? 1 : 0) + (value.overdueOnly ? 1 : 0) + (value.status ? 1 : 0);

  return (
    <div className="space-y-2">
      <SearchBox value={value.search} onChange={(search) => onChange({ ...value, search })} />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <button className={pill(active === 0)} onClick={() => onChange(EMPTY_FILTERS)}>Todos</button>
        <button className={pill(value.overdueOnly)} onClick={() => onChange({ ...EMPTY_FILTERS, overdueOnly: true })}>
          Atrasadas {counts ? <span className="opacity-70 tnum">{counts.overdue}</span> : null}
        </button>
        <button className={pill(value.status === "in_progress")} onClick={() => onChange({ ...EMPTY_FILTERS, status: "in_progress" })}>
          Em andamento {counts ? <span className="opacity-70 tnum">{counts.inProgress}</span> : null}
        </button>
        <button className={pill(value.status === "completed")} onClick={() => onChange({ ...EMPTY_FILTERS, status: "completed" })}>
          Concluídas {counts ? <span className="opacity-70 tnum">{counts.completed}</span> : null}
        </button>
      </div>
    </div>
  );
}

export function AttentionSection({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-on-surface">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          {title}
        </h2>
        {count !== undefined && <span className="text-xs text-on-surface-variant tnum">{count} itens</span>}
      </div>
      {children}
    </section>
  );
}

export function CommentTimeline({ comments }: { comments: { id: string; authorId: string; body: string; createdAt: string }[] }) {
  if (!comments.length) return <p className="text-sm text-on-surface-variant">Nenhuma observação ainda.</p>;
  return (
    <ol className="space-y-2">
      {comments.map((c) => (
        <li key={c.id} className="flex items-start gap-2.5">
          <AssigneeAvatar name={userName(c.authorId)} size={30} />
          <div className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-on-surface">{userName(c.authorId)}</span>
              <span className="text-[11px] text-outline tnum">{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-sm text-on-surface-variant">{c.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AttachmentIcon() {
  return <Paperclip size={14} />;
}
