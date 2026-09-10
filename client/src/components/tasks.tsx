import { Link } from "react-router-dom";
import type { TaskPriority, TaskStatus } from "@hubagendor/shared";
import { dueLabel, formatDateTime, userName } from "../lib/format.js";
import { AssigneeAvatar, PriorityBadge, TaskStatusBadge } from "./ui.js";

export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  clientName?: string | null;
  dueAt: string | null;
  overdue?: boolean;
}

/** Cartão mostra responsável, cliente, prazo relativo+objetivo, status e
 *  prioridade sem abrir menus (UX §7.3, §21 item 8). */
export function TaskCard({ task }: { task: TaskListItem }) {
  return (
    <Link to={`/app/tasks/${task.id}`} className="block rounded-2xl border bg-white p-4 shadow-sm active:bg-neutral-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold">{task.title}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {userName(task.assigneeId)}
            {task.clientName ? ` • ${task.clientName}` : ""}
          </p>
          <p className={`mt-1 text-xs ${task.overdue ? "font-bold text-danger-700" : "text-neutral-500"}`}>
            {dueLabel(task.dueAt, task.overdue ?? false)}
          </p>
        </div>
        <AssigneeAvatar name={userName(task.assigneeId)} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <TaskStatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
    </Link>
  );
}

export function TaskList({ tasks }: { tasks: TaskListItem[] }) {
  if (!tasks.length) return null;
  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <li key={t.id}><TaskCard task={t} /></li>
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

/** Filtros com contagem de ativos + limpar (UX §8.2). */
export function TaskFilters({
  value, onChange,
}: {
  value: TaskFilterValue;
  onChange: (v: TaskFilterValue) => void;
}) {
  const active = (value.search ? 1 : 0) + (value.overdueOnly ? 1 : 0) + (value.status ? 1 : 0);
  return (
    <div className="mb-3 space-y-2">
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Buscar tarefa…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="touch-target min-w-0 flex-1 rounded-xl border px-3"
          aria-label="Buscar tarefas"
        />
        <button
          onClick={() => onChange({ ...value, overdueOnly: !value.overdueOnly })}
          aria-pressed={value.overdueOnly}
          className={`touch-target rounded-xl border px-3 text-sm font-semibold ${value.overdueOnly ? "bg-danger-600 text-white" : "bg-white"}`}
        >
          Atrasadas
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as TaskFilterValue["status"] })}
          className="touch-target rounded-xl border bg-white px-3 text-sm"
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          <option value="todo">A fazer</option>
          <option value="in_progress">Em andamento</option>
          <option value="completed">Concluídas</option>
        </select>
        {active > 0 && (
          <button onClick={() => onChange(EMPTY_FILTERS)} className="touch-target rounded-xl border bg-white px-3 text-sm font-semibold">
            Limpar{active > 1 ? ` (${active})` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

export function AttentionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

export function CommentTimeline({ comments }: { comments: { id: string; authorId: string; body: string; createdAt: string }[] }) {
  return (
    <ol className="space-y-2">
      {comments.map((c) => (
        <li key={c.id} className="rounded-xl bg-neutral-100 p-3 text-sm">
          <p className="text-xs text-neutral-500">{userName(c.authorId)} • {formatDateTime(c.createdAt)}</p>
          <p className="mt-1">{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
