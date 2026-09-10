import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GripVertical, Monitor } from "lucide-react";
import type { TaskStatus } from "@hubagendor/shared";
import { trpc } from "../lib/trpc.js";
import { dueLabel, userName } from "../lib/format.js";
import { AssigneeAvatar, ErrorState, LoadingState, PriorityBadge } from "../components/ui.js";
import { useToast } from "../components/Toast.js";

const COLUMNS: { status: Exclude<TaskStatus, "archived">; label: string; bar: string }[] = [
  { status: "todo", label: "A fazer", bar: "bg-slate-400" },
  { status: "in_progress", label: "Em andamento", bar: "bg-info-600" },
  { status: "completed", label: "Concluídas", bar: "bg-success-600" },
];

type Item = {
  id: string; title: string; status: TaskStatus; priority: "low" | "normal" | "high" | "urgent";
  assigneeId: string; dueAt: string | null; overdue?: boolean;
};

/** Quadro Kanban — arrastar só no desktop (plano2.0 #8). Mobile usa listas. */
export function BoardPage() {
  const utils = trpc.useUtils();
  const notify = useToast();
  const list = trpc.tasks.list.useQuery({ scope: "all", pageSize: 100 });
  const [dragging, setDragging] = useState<string | null>(null);

  const setStatus = trpc.tasks.setStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.tasks.list.cancel();
      const prev = utils.tasks.list.getData({ scope: "all", pageSize: 100 });
      utils.tasks.list.setData({ scope: "all", pageSize: 100 }, (old) =>
        old ? { ...old, items: old.items.map((t) => (t.id === id ? { ...t, status } : t)) } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.tasks.list.setData({ scope: "all", pageSize: 100 }, ctx.prev);
      notify("Não foi possível mover a tarefa.", "error");
    },
    onSuccess: (_d, v) => notify(v.status === "completed" ? "Tarefa concluída." : "Tarefa atualizada."),
    onSettled: () => { utils.tasks.list.invalidate(); utils.tasks.getSummary.invalidate(); },
  });

  const grouped = useMemo(() => {
    const items = (list.data?.items ?? []) as Item[];
    return COLUMNS.map((c) => ({ ...c, items: items.filter((t) => t.status === c.status) }));
  }, [list.data]);

  if (list.isPending) return <LoadingState />;
  if (list.isError) return <ErrorState message="Não foi possível carregar o quadro." onRetry={() => list.refetch()} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Quadro</h1>
          <p className="mt-0.5 text-sm text-slate-500">Arraste os cards para mudar o status.</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 md:flex">
          <Monitor size={14} /> Somente desktop
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-line-strong bg-white p-3 text-center text-sm text-slate-500 md:hidden">
        No celular use a lista de tarefas e as ações rápidas. O arrastar está disponível no desktop.
        <div className="mt-2"><Link to="/app/tasks" className="font-semibold text-accent-700">Ir para tarefas</Link></div>
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        {grouped.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragging) { setStatus.mutate({ id: dragging, status: col.status, reason: col.status === "in_progress" ? "Movido no quadro" : undefined }); setDragging(null); } }}
            className="flex min-h-[300px] flex-col rounded-xl border border-line bg-slate-50/60"
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className={`h-2 w-2 rounded-full ${col.bar}`} /> {col.label}
              </span>
              <span className="text-xs text-slate-400 tnum">{col.items.length}</span>
            </div>
            <ul className="flex flex-1 flex-col gap-2 p-2">
              {col.items.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={() => setDragging(t.id)}
                  onDragEnd={() => setDragging(null)}
                  className={`cursor-grab rounded-lg border border-line bg-white p-2.5 shadow-sm active:cursor-grabbing ${dragging === t.id ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <Link to={`/app/tasks/${t.id}`} className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-accent-700">{t.title}</Link>
                    <GripVertical size={15} className="mt-0.5 shrink-0 text-slate-300" />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><AssigneeAvatar name={userName(t.assigneeId)} size={18} /> {userName(t.assigneeId)}</span>
                    <span className={t.overdue ? "font-semibold text-danger-700" : ""}>{dueLabel(t.dueAt, t.overdue ?? false)}</span>
                  </div>
                  <div className="mt-1.5"><PriorityBadge priority={t.priority} /></div>
                </li>
              ))}
              {col.items.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-slate-400">Solte um card aqui</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
