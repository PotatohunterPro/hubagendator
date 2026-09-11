import { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDashed, Loader } from "lucide-react";
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
    `flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${active ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-[13px] text-on-surface-variant">Veja o que precisa da sua atenção agora.</p>
      </div>

      {summary.isPending ? (
        <MetricSkeleton />
      ) : summary.isError ? (
        <ErrorState message="Não foi possível carregar o painel." onRetry={() => summary.refetch()} />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
            <StatCard label="Atrasadas" value={s!.overdue} to="/app/tasks?overdueOnly=1" tone="danger" icon={AlertTriangle} />
            <StatCard label="Para Hoje" value={s!.dueToday} to="/app/tasks?due=today" tone="attention" icon={CalendarClock} />
            <StatCard label="Em andamento" value={s!.inProgress} to="/app/tasks?status=in_progress" tone="info" icon={Loader} />
            <StatCard label="Concluídas hoje" value={s!.completedToday} to="/app/tasks?status=completed" tone="success" icon={CheckCircle2} />
            <StatCard label="Sem Prazo" value={s!.noDueDate} to="/app/tasks?due=none" tone="neutral" icon={CircleDashed} />
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-tier-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant">Taxa de conclusão</span>
              <span className="font-semibold tnum">{s!.completion.rate}% <span className="font-normal text-outline">· {s!.completion.done}/{s!.completion.total}</span></span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-success-600" style={{ width: `${s!.completion.rate}%` }} />
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-on-surface">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
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
        <div className="rounded-xl border border-dashed border-outline bg-surface-container-lowest p-8 text-center">
          <p className="font-semibold text-on-surface">Nada pendente aqui</p>
          <p className="mt-1 text-sm text-on-surface-variant">Sem atrasos, tarefas críticas ou pendências neste filtro.</p>
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
