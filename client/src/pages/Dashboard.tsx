import { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Loader, RefreshCw } from "lucide-react";
import { trpc } from "../lib/trpc.js";
import { greeting } from "../lib/format.js";
import { TaskList, type TaskListItem } from "../components/tasks.js";
import { ErrorState, LoadingState, MetricSkeleton, StatCard } from "../components/ui.js";
import { useToast } from "../components/Toast.js";

type Pill = "todos" | "criticas" | "stale" | "hoje";

/** Painel de atenção — responde "o que precisa da minha atenção agora?" (plano2.0 #1). */
export function DashboardPage() {
  const me = trpc.auth.me.useQuery();
  const summary = trpc.tasks.getSummary.useQuery();
  const notify = useToast();
  const utils = trpc.useUtils();
  const [pill, setPill] = useState<Pill>("todos");

  const remind = trpc.tasks.sendReminder.useMutation({
    onSuccess: () => { utils.tasks.getSummary.invalidate(); notify("Cobrança enviada."); },
    onError: () => notify("Não foi possível enviar a cobrança.", "error"),
  });

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const firstName = me.data?.user?.name?.split(" ")[0] ?? "";

  const s = summary.data;
  const lists: Record<Pill, TaskListItem[]> = {
    todos: dedupe([...(s?.overdueItems ?? []), ...(s?.staleItems ?? []), ...(s?.dueTodayItems ?? [])]),
    criticas: (s?.overdueItems ?? []) as TaskListItem[],
    stale: (s?.staleItems ?? []) as TaskListItem[],
    hoje: (s?.dueTodayItems ?? []) as TaskListItem[],
  };
  const shown = lists[pill];

  const pillCls = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${active ? "bg-accent-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">Veja o que precisa da sua atenção agora · {today}</p>
      </div>

      {summary.isPending ? (
        <MetricSkeleton />
      ) : summary.isError ? (
        <ErrorState message="Não foi possível carregar o painel." onRetry={() => summary.refetch()} />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
            <StatCard label="Atrasadas" value={s!.overdue} to="/app/tasks?overdueOnly=1" tone="danger" icon={AlertTriangle} />
            <StatCard label="Para hoje" value={s!.dueToday} to="/app/tasks?due=today" tone="attention" icon={CalendarClock} />
            <StatCard label="Em andamento" value={s!.inProgress} to="/app/tasks?status=in_progress" tone="info" icon={Loader} />
            <StatCard label="Concluídas hoje" value={s!.completedToday} to="/app/tasks?status=completed" tone="success" icon={CheckCircle2} />
            <StatCard label="Sem prazo" value={s!.noDueDate} to="/app/tasks?due=none" tone="neutral" icon={CircleDashed} />
            <StatCard label="Sem atualização" value={s!.stale} to="/app/tasks?status=in_progress" tone="attention" icon={RefreshCw} />
          </div>

          <div className="rounded-xl border border-line bg-white p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Taxa de conclusão</span>
              <span className="font-semibold tnum">{s!.completion.rate}% <span className="font-normal text-slate-400">· {s!.completion.done}/{s!.completion.total}</span></span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-accent-600" style={{ width: `${s!.completion.rate}%` }} />
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-slate-900">
          <span className="h-2 w-2 rounded-full bg-accent-600" aria-hidden />
          Precisa da sua atenção
        </h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          <button className={pillCls(pill === "todos")} onClick={() => setPill("todos")}>Todos</button>
          <button className={pillCls(pill === "criticas")} onClick={() => setPill("criticas")}>Críticas {s ? <span className="opacity-70 tnum">{s.overdue}</span> : null}</button>
          <button className={pillCls(pill === "stale")} onClick={() => setPill("stale")}>Sem atualização {s ? <span className="opacity-70 tnum">{s.stale}</span> : null}</button>
          <button className={pillCls(pill === "hoje")} onClick={() => setPill("hoje")}>Vencendo hoje {s ? <span className="opacity-70 tnum">{s.dueToday}</span> : null}</button>
        </div>
      </div>

      {summary.isPending ? (
        <LoadingState label="Carregando atenção…" />
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-white p-8 text-center">
          <p className="font-semibold text-slate-800">Nada pendente aqui 🎉</p>
          <p className="mt-1 text-sm text-slate-500">Sem atrasos, tarefas críticas ou pendências neste filtro.</p>
        </div>
      ) : (
        <TaskList tasks={shown} onRemind={(id) => remind.mutate({ id })} />
      )}
    </div>
  );
}

function dedupe(items: TaskListItem[]): TaskListItem[] {
  const seen = new Set<string>();
  return items.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}
