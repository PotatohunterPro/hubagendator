import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc.js";
import { greeting } from "../lib/format.js";
import { AttentionSection, TaskList } from "../components/tasks.js";
import { DashboardMetricCard, EmptyState, ErrorState, MetricSkeleton, LoadingState, PageHeader } from "../components/ui.js";

/** Painel responde: "o que está acontecendo e onde agir?" (UX §1). */
export function DashboardPage() {
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const summary = trpc.tasks.getSummary.useQuery();
  const overdue = trpc.tasks.list.useQuery({ scope: "all", overdueOnly: true, pageSize: 5 });
  const dueToday = trpc.tasks.list.useQuery({ scope: "all", due: "today", pageSize: 5 });

  return (
    <div>
      <PageHeader title={`${greeting()}, Carlos`} subtitle={today} />

      {summary.isPending ? <MetricSkeleton /> :
        summary.isError ? <ErrorState message="Não foi possível carregar o painel." onRetry={() => summary.refetch()} /> : (
        <>
        <Link to="/app/tasks?status=completed" className="mb-3 block rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Taxa de conclusão</p>
          <p className="text-xl font-bold">{summary.data.completion.rate}% <span className="text-sm font-normal text-neutral-500">• {summary.data.completion.done} de {summary.data.completion.total} tarefas</span></p>
        </Link>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <DashboardMetricCard label="Atrasadas" value={summary.data.overdue} to="/app/tasks?overdueOnly=1" danger />
          <DashboardMetricCard label="Vencendo hoje" value={summary.data.dueToday} to="/app/tasks?due=today" />
          <DashboardMetricCard label="Em andamento" value={summary.data.inProgress} to="/app/tasks?status=in_progress" />
          <DashboardMetricCard label="Concluídas hoje" value={summary.data.completedToday} to="/app/tasks?status=completed" />
          <DashboardMetricCard label="Sem prazo" value={summary.data.noDueDate} to="/app/tasks?due=none" />
        </div>
        </>
      )}

      <AttentionSection title="Precisa de atenção">
        {overdue.isPending ? <LoadingState label="Buscando atrasadas…" /> :
          overdue.isError ? <ErrorState message="Não foi possível carregar as atrasadas." onRetry={() => overdue.refetch()} /> :
          !overdue.data || overdue.data.items.length === 0
            ? <EmptyState title="Nenhuma tarefa atrasada" hint="Quando algo atrasar, aparece aqui." action={<Link to="/app/tasks" className="font-semibold text-accent-700">Ver todas as tarefas</Link>} />
            : <TaskList tasks={overdue.data.items} />}
      </AttentionSection>

      <AttentionSection title="Vencendo hoje">
        {dueToday.isPending ? <LoadingState label="Buscando tarefas de hoje…" /> :
          !dueToday.data || dueToday.data.items.length === 0
            ? <EmptyState title="Nada vencendo hoje" hint="O dia está livre — que tal adiantar próximas tarefas?" />
            : <TaskList tasks={dueToday.data.items} />}
      </AttentionSection>
    </div>
  );
}
