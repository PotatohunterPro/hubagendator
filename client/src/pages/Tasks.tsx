import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ChevronDown, Clock, History, Paperclip, Play, RotateCcw, Send, TriangleAlert,
} from "lucide-react";
import type { TaskOrigin, TaskStatus } from "@hubagendor/shared";
import { ORIGIN_LABEL, PRIORITY_LABEL, taskOrigins, taskPriorities } from "@hubagendor/shared";
import { trpc } from "../lib/trpc.js";
import { getToken } from "../lib/session.js";
import { dueLabel, formatDateTime, isDueToday, userName } from "../lib/format.js";
import { AttachmentIcon, CommentTimeline, EMPTY_FILTERS, TaskFilters, TaskList, type TaskFilterValue, type TaskListItem } from "../components/tasks.js";
import { AssigneeAvatar, EmptyState, ErrorState, LoadingState, PageHeader, PriorityBadge, TaskStatusBadge } from "../components/ui.js";
import { useToast } from "../components/Toast.js";

const VALID_STATUS = ["todo", "in_progress", "completed"] as const;

/* ---------------------------------------------------------------- Listas */

export function TasksPage({ scope }: { scope: "all" | "mine" }) {
  const [params] = useSearchParams();
  const me = trpc.auth.me.useQuery();
  const [filters, setFilters] = useState<TaskFilterValue>({
    ...EMPTY_FILTERS,
    overdueOnly: params.get("overdueOnly") === "1",
    status: (VALID_STATUS as readonly string[]).includes(params.get("status") ?? "")
      ? (params.get("status") as TaskStatus)
      : "",
  });
  const due = params.get("due");
  const assignee = params.get("assignee") ?? undefined;
  const list = trpc.tasks.list.useQuery({
    scope,
    search: filters.search,
    overdueOnly: filters.overdueOnly,
    status: filters.status || undefined,
    assigneeId: assignee,
    due: due === "today" || due === "none" ? due : undefined,
    pageSize: scope === "mine" ? 100 : 20,
  });

  const firstName = me.data?.user?.name?.split(" ")[0] ?? "";
  return (
    <div>
      {scope === "mine" ? (
        <div className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-on-surface">Minhas Tarefas</h1>
          <p className="mt-0.5 text-sm text-on-surface-variant">O que você precisa fazer agora{firstName ? `, ${firstName}` : ""}.</p>
        </div>
      ) : (
        <PageHeader title="Tarefas" subtitle="Toque para abrir, iniciar e concluir" />
      )}
      {scope === "mine" && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {([
            ["Atrasadas", { ...filters, overdueOnly: true, status: "" as const }],
            ["Para Hoje", { ...filters, overdueOnly: false, status: "todo" as const }],
            ["Em Andamento", { ...filters, overdueOnly: false, status: "in_progress" as const }],
            ["Próximas", { ...filters, overdueOnly: false, status: "todo" as const }],
            ["Concluídas", { ...filters, overdueOnly: false, status: "completed" as const }],
          ] as const).map(([label, next]) => (
            <button key={label} type="button" onClick={() => setFilters(next)} className="h-9 shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest px-3 text-[13px] font-medium text-on-surface-variant hover:bg-surface-container">{label}</button>
          ))}
        </div>
      )}
      <TaskFilters value={filters} onChange={setFilters} />
      {list.isPending ? <LoadingState /> :
        list.isError ? <ErrorState message="Não foi possível carregar. Verifique sua conexão e tente novamente." onRetry={() => list.refetch()} /> :
        list.data.items.length === 0 ? <EmptyState title="Não encontramos tarefas com esses filtros" hint="Ajuste a busca ou limpe os filtros." action={<button onClick={() => setFilters(EMPTY_FILTERS)} className="font-semibold text-primary">Limpar filtros</button>} /> :
        scope === "mine" ? <MyTasksGroups items={list.data.items} /> : <TaskList tasks={list.data.items} />}
    </div>
  );
}

/** Grupos por urgência operacional — plano2.0 #7. */
function MyTasksGroups({ items }: { items: TaskListItem[] }) {
  const open = (t: TaskListItem) => t.status !== "completed" && t.status !== "archived";
  const overdue = items.filter((t) => t.overdue);
  const today = items.filter((t) => open(t) && !t.overdue && t.dueAt && isDueToday(t.dueAt));
  const inProgress = items.filter((t) => t.status === "in_progress" && !t.overdue && !(t.dueAt && isDueToday(t.dueAt)));
  const upcoming = items.filter((t) => t.status === "todo" && !t.overdue && !(t.dueAt && isDueToday(t.dueAt)));
  const done = items.filter((t) => t.status === "completed").slice(0, 5);

  if (!overdue.length && !today.length && !inProgress.length && !upcoming.length && !done.length) {
    return <EmptyState title="Você não tem tarefas pendentes" hint="Quando atribuírem algo a você, aparece aqui." />;
  }
  return (
    <div>
      {overdue.length > 0 && <Group title="Atrasadas" count={overdue.length}><TaskList tasks={overdue} /></Group>}
      {today.length > 0 && <Group title="Hoje" count={today.length}><TaskList tasks={today} /></Group>}
      {inProgress.length > 0 && <Group title="Em andamento" count={inProgress.length}><TaskList tasks={inProgress} /></Group>}
      {upcoming.length > 0 && <Group title="Próximas" count={upcoming.length}><TaskList tasks={upcoming} /></Group>}
      {done.length > 0 && <Group title="Concluídas" count={done.length}><TaskList tasks={done} /></Group>}
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-on-surface">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          {title}
        </h2>
        <span className="text-xs text-on-surface-variant tnum">{count}</span>
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- Criar */

function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function NewTaskPage() {
  const nav = useNavigate();
  const utils = trpc.useUtils();
  const notify = useToast();
  const members = trpc.organization.getMembers.useQuery();
  const teams = trpc.teams.list.useQuery();
  const clients = trpc.clients.list.useQuery();
  const [params] = useSearchParams();

  const [created, setCreated] = useState<{ id: string; assigneeId: string } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(params.get("assignee") ?? "");
  const [priority, setPriority] = useState<(typeof taskPriorities)[number]>("normal");
  const [origin, setOrigin] = useState<"" | TaskOrigin>("");
  const [teamId, setTeamId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [showMore, setShowMore] = useState(false);
  // Agendamento (Agenda v1)
  const [hasSchedule, setHasSchedule] = useState(Boolean(params.get("date") && params.get("start")));
  const [schedDate, setSchedDate] = useState(params.get("date") ?? "");
  const [schedStart, setSchedStart] = useState(params.get("start") ?? "");
  const [schedEnd, setSchedEnd] = useState(params.get("end") ?? "");
  const [location, setLocation] = useState("");

  const create = trpc.tasks.create.useMutation({
    onSuccess: (task) => {
      utils.tasks.list.invalidate();
      utils.tasks.getSummary.invalidate();
      notify("Demanda Encaminhada!");
      setCreated({ id: task.id, assigneeId: task.assigneeId });
    },
    onError: () => notify("Não foi possível salvar. O rascunho continua aqui.", "error"),
  });

  const activeMembers = (members.data ?? []).filter((m) => m.active);

  // Checagem de conflito de horário (avisa, não bloqueia — Agenda §9).
  const conflictInput = useMemo(() => {
    if (!hasSchedule || !assigneeId || !schedDate || !schedStart || !schedEnd) return null;
    const start = new Date(`${schedDate}T${schedStart}`);
    const end = new Date(`${schedDate}T${schedEnd}`);
    if (end <= start) return null;
    return { assigneeId, scheduledStart: start, scheduledEnd: end };
  }, [hasSchedule, assigneeId, schedDate, schedStart, schedEnd]);
  const conflicts = trpc.tasks.checkConflict.useQuery(
    conflictInput ?? { assigneeId: "", scheduledStart: new Date(), scheduledEnd: new Date() },
    { enabled: Boolean(conflictInput) },
  );
  const conflictList = conflictInput ? (conflicts.data ?? []) : [];

  function submit() {
    if (!title.trim()) { notify("Informe o título da tarefa.", "error"); return; }
    if (!assigneeId) { notify("Selecione um responsável.", "error"); return; }
    let scheduledStart: Date | undefined;
    let scheduledEnd: Date | undefined;
    if (hasSchedule) {
      if (!schedDate || !schedStart || !schedEnd) { notify("Informe data, início e fim do agendamento.", "error"); return; }
      scheduledStart = new Date(`${schedDate}T${schedStart}`);
      scheduledEnd = new Date(`${schedDate}T${schedEnd}`);
      if (scheduledEnd <= scheduledStart) { notify("O fim deve ser posterior ao início.", "error"); return; }
    }
    create.mutate({
      title,
      description: description || undefined,
      assigneeId,
      priority,
      origin: origin || undefined,
      teamId: teamId || undefined,
      clientId: clientId || undefined,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      scheduledStart,
      scheduledEnd,
      location: hasSchedule && location ? location : undefined,
    });
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
          <CheckCircle2 size={26} />
        </div>
        <p role="status" className="font-semibold text-on-surface">Demanda Encaminhada!</p>
        <p className="text-[13px] text-on-surface-variant">Notificação enviada ao responsável.</p>
        <Link to={`/app/tasks/${created.id}`} className="block rounded-md bg-primary-container py-3 font-semibold text-on-primary">Abrir tarefa</Link>
        <button onClick={() => { setCreated(null); setTitle(""); setDescription(""); setDueAt(""); }} className="block w-full rounded-md border border-outline-variant bg-surface-container-lowest py-3 font-semibold">Criar outra</button>
        <button onClick={() => nav("/app")} className="w-full py-3 font-semibold text-on-surface-variant">Voltar ao painel</button>
      </div>
    );
  }

  const card = "rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-tier-1";
  const label = "mb-1.5 block text-[13px] font-medium text-on-surface";
  const field = "h-11 w-full rounded-md border border-outline-variant bg-surface-container-low px-3 text-[13px] outline-none focus:border-primary focus:bg-surface-container-lowest";

  return (
    <form className="mx-auto max-w-lg space-y-3 pb-28" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <PageHeader title="Nova Tarefa" subtitle="Registre uma demanda operacional direta da equipe." />

      <div className={card}>
        <label className={label} htmlFor="nt-title">Título da Demanda</label>
        <input id="nt-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Ex.: Configurar computador do cliente" />
      </div>

      <div className={card}>
        <label className={label}>Responsável pela Execução</label>
        <div className="grid grid-cols-2 gap-2">
          {activeMembers.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setAssigneeId(m.id)}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left transition ${assigneeId === m.id ? "border-primary bg-primary-fixed" : "border-outline-variant bg-surface-container-low hover:bg-surface-container"}`}
            >
              <AssigneeAvatar name={m.name} size={28} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-on-surface">{m.name}</span>
                <span className="block truncate text-[11px] text-on-surface-variant">{m.role}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <label className={label}>Prioridade</label>
        <div className="grid grid-cols-4 gap-1.5">
          {taskPriorities.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPriority(p)}
              className={`rounded-lg border py-2 text-xs font-semibold transition ${priority === p ? "border-primary bg-primary-fixed text-primary" : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <label className={label}>Prazo de Conclusão</label>
        <input type="datetime-local" className={field} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <QuickDue label="+2 horas" onClick={() => setDueAt(toLocalInput(new Date(Date.now() + 2 * 3600 * 1000)))} />
          <QuickDue label="Fim do dia" onClick={() => { const d = new Date(); d.setHours(18, 0, 0, 0); setDueAt(toLocalInput(d)); }} />
          <QuickDue label="Amanhã" onClick={() => { const d = new Date(Date.now() + 86400000); d.setHours(12, 0, 0, 0); setDueAt(toLocalInput(d)); }} />
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between">
          <label className={label + " mb-0"}>Agendamento</label>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setHasSchedule(false)} className={`h-8 rounded-md border px-3 text-xs font-semibold ${!hasSchedule ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-low text-on-surface-variant"}`}>Não</button>
            <button type="button" onClick={() => setHasSchedule(true)} className={`h-8 rounded-md border px-3 text-xs font-semibold ${hasSchedule ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-low text-on-surface-variant"}`}>Sim</button>
          </div>
        </div>
        {hasSchedule && (
          <div className="mt-3 space-y-2">
            <div>
              <span className="mb-1 block text-[12px] text-on-surface-variant">Data</span>
              <input type="date" className={field} value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="mb-1 block text-[12px] text-on-surface-variant">Início</span>
                <input type="time" className={field} value={schedStart} onChange={(e) => setSchedStart(e.target.value)} />
              </div>
              <div>
                <span className="mb-1 block text-[12px] text-on-surface-variant">Fim</span>
                <input type="time" className={field} value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <span className="mb-1 block text-[12px] text-on-surface-variant">Local</span>
              <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Bairro Y" />
            </div>
            {conflictList.length > 0 && (
              <div role="alert" className="rounded-lg border border-attention-200 bg-attention-100/60 p-3 text-[12px] text-attention-800">
                <p className="flex items-center gap-1.5 font-semibold"><TriangleAlert size={14} /> {userName(assigneeId)} já possui outra atividade neste horário:</p>
                <ul className="mt-1 list-disc pl-5">
                  {conflictList.map((c) => (
                    <li key={c.id}>“{c.title}” ({new Date(c.scheduledStart).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}–{new Date(c.scheduledEnd).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})</li>
                  ))}
                </ul>
                <p className="mt-1">Você pode manter mesmo assim.</p>
              </div>
            )}
          </div>
        )}
        <p className="mt-2 text-[11px] text-on-surface-variant">O prazo é o limite de conclusão; o agendamento é quando a atividade será executada.</p>
      </div>

      <button type="button" onClick={() => setShowMore((v) => !v)} className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface">
        Instruções
        <ChevronDown size={18} className={`transition ${showMore ? "rotate-180" : ""}`} />
      </button>

      {showMore && (
        <div className="space-y-3">
          <div className={card}>
            <label className={label} htmlFor="nt-desc">Checklist ou contexto</label>
            <textarea id="nt-desc" rows={3} className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm outline-none focus:border-primary focus:bg-surface-container-lowest" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes operacionais do que precisa ser feito…" />
          </div>
          <div className={card}>
            <label className={label}>Origem do Pedido</label>
            <div className="flex flex-wrap gap-1.5">
              {taskOrigins.map((o) => (
                <button type="button" key={o} onClick={() => setOrigin(origin === o ? "" : o)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${origin === o ? "border-primary bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-low text-on-surface-variant"}`}>
                  {ORIGIN_LABEL[o]}
                </button>
              ))}
            </div>
          </div>
          <div className={`${card} grid grid-cols-1 gap-3`}>
            <div>
              <label className={label} htmlFor="nt-team">Equipe Responsável</label>
              <select id="nt-team" className={field} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">Sem equipe</option>
                {(teams.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="nt-client">Cliente Vinculado <span className="font-normal text-on-surface-variant">Opcional</span></label>
              <select id="nt-client" className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Sem cliente</option>
                {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-outline-variant bg-surface-container-lowest/95 p-4 pb-safe backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <button type="submit" disabled={create.isPending} className="w-full rounded-xl bg-primary-container py-3 font-semibold text-on-primary shadow-sm disabled:opacity-50">
          {create.isPending ? "Despachando…" : "Criar e Atribuir Tarefa"}
        </button>
        <button type="button" onClick={() => nav(-1)} className="mt-1 w-full py-2 text-sm font-medium text-on-surface-variant">Cancelar</button>
      </div>
    </form>
  );
}

function QuickDue({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-outline-variant bg-surface-container-low py-1.5 text-xs text-on-surface-variant hover:bg-surface-container">
      {label}
    </button>
  );
}

/* ---------------------------------------------------------------- Detalhe */

export function TaskDetailPage() {
  const { id } = useParams();
  const notify = useToast();
  const detail = trpc.tasks.getById.useQuery({ id: id ?? "" }, { enabled: !!id });
  const events = trpc.tasks.getEvents.useQuery({ id: id ?? "" }, { enabled: !!id });
  const utils = trpc.useUtils();
  const refresh = () => { utils.tasks.getById.invalidate(); utils.tasks.list.invalidate(); utils.tasks.getSummary.invalidate(); };

  const setStatus = trpc.tasks.setStatus.useMutation({
    onSuccess: (_d, v) => { refresh(); notify(v.status === "completed" ? "Tarefa concluída." : "Tarefa atualizada."); },
    onError: () => notify("Você não tem permissão para alterar esta tarefa.", "error"),
  });
  const remind = trpc.tasks.sendReminder.useMutation({
    onSuccess: () => { refresh(); notify("Cobrança enviada."); },
    onError: () => notify("Não foi possível enviar a cobrança.", "error"),
  });
  const addComment = trpc.tasks.addComment.useMutation({
    onSuccess: () => { utils.tasks.getById.invalidate(); notify("Observação adicionada."); },
    onError: () => notify("Não foi possível salvar a observação.", "error"),
  });
  const reopen = trpc.tasks.reopen.useMutation({
    onSuccess: () => { refresh(); notify("Tarefa reaberta."); setReopenOpen(false); setReason(""); },
    onError: () => notify("Informe o motivo da reabertura.", "error"),
  });

  const [comment, setComment] = useState("");
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (detail.isPending) return <LoadingState />;
  if (detail.isError || !detail.data) return <ErrorState message="Tarefa não encontrada." />;
  const t = detail.data;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <div className="flex flex-wrap items-center gap-1.5">
        <TaskStatusBadge status={t.status} />
        <PriorityBadge priority={t.priority} />
        {t.clientName && <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[11px] text-on-surface-variant">{t.clientName}</span>}
        {t.origin && <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[11px] text-on-surface-variant">Origem: {ORIGIN_LABEL[t.origin]}</span>}
      </div>

      <div>
        <Link to="/app/my-tasks" className="mb-1 inline-flex items-center gap-1 text-[13px] text-primary">
          <ArrowLeft size={15} /> Minhas Tarefas
        </Link>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-on-surface">{t.title}</h1>
        <p className="mt-1 text-[12px] text-on-surface-variant">Criada por {userName(t.creatorId)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
          <AssigneeAvatar name={userName(t.assigneeId)} size={36} />
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Responsável</span>
            <p className="truncate text-[13px] font-medium text-on-surface">{userName(t.assigneeId)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container text-primary"><Clock size={18} /></span>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Prazo Fatal</span>
            <p className={`truncate text-sm font-medium ${t.overdue ? "text-error" : "text-on-surface"}`}>{dueLabel(t.dueAt, t.overdue)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {t.status === "todo" && (
          <button onClick={() => setStatus.mutate({ id: t.id, status: "in_progress" })} disabled={setStatus.isPending} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-3 font-semibold text-on-primary disabled:opacity-50">
            <Play size={18} /> Iniciar tarefa
          </button>
        )}
        {t.status === "in_progress" && (
          <button onClick={() => setStatus.mutate({ id: t.id, status: "completed" })} disabled={setStatus.isPending} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-container py-3 font-semibold text-on-primary disabled:opacity-50">
            <CheckCircle2 size={18} /> Concluir Tarefa
          </button>
        )}
        {(t.status === "todo" || t.status === "in_progress") && (
          <button onClick={() => remind.mutate({ id: t.id })} disabled={remind.isPending} className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-semibold text-on-surface">
            <TriangleAlert size={16} /> Cobrar /
          </button>
        )}
        {t.status === "completed" && (
          <button onClick={() => setReopenOpen(true)} className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-semibold text-on-surface">
            <RotateCcw size={16} /> Reabrir tarefa
          </button>
        )}
      </div>

      {reopenOpen && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-on-surface" htmlFor="reopen-reason">Motivo da reabertura *</label>
          <input id="reopen-reason" className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: Cliente solicitou nova ação." />
          <div className="mt-2 flex gap-2">
            <button onClick={() => reopen.mutate({ id: t.id, reason })} disabled={reopen.isPending || !reason.trim()} className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">Confirmar reabertura</button>
            <button onClick={() => setReopenOpen(false)} className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium">Cancelar</button>
          </div>
        </div>
      )}

      {t.description && (
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold text-on-surface"><Paperclip size={16} className="text-primary" /> Descrição Operacional</h2>
          <p className="whitespace-pre-wrap rounded-lg bg-surface-container-low p-3 text-sm leading-relaxed text-on-surface">{t.description}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-on-surface"><History size={16} className="text-secondary" /> Timeline Operacional <span className="ml-auto text-[11px] font-medium uppercase tracking-[.05em] text-secondary">Tempo Real</span></h2>
        <CommentTimeline comments={t.comments} />
        <form className="rounded-xl border border-outline-variant bg-surface-container-lowest p-2.5 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (comment.trim()) { addComment.mutate({ id: t.id, body: comment }); setComment(""); } }}>
          <textarea rows={2} className="w-full resize-none rounded-lg bg-surface-container-low p-2 text-sm outline-none" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Adicionar uma atualização operacional…" aria-label="Adicionar observação" />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-on-surface-variant"><AttachmentIcon /> Anexar arquivo ou foto</span>
            <button className="flex items-center gap-1.5 rounded-md bg-primary-container px-3 py-1.5 text-[13px] font-semibold text-on-primary">
              <Send size={15} /> Enviar
            </button>
          </div>
        </form>
      </section>

      <AttachmentSection taskId={t.id} attachments={t.attachments} />

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-on-surface"><History size={16} className="text-outline" /> Histórico de auditoria</span>
            <ChevronDown size={18} className="text-outline" />
          </summary>
          <ul className="mt-3 space-y-2">
            {events.data?.map((ev) => (
              <li key={ev.id} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-outline" />
                <span><strong className="font-semibold text-on-surface">{userName(ev.actorId)}</strong> — {ev.eventType} · <span className="text-outline tnum">{formatDateTime(ev.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Anexos de evidência — nome/tipo/tamanho antes do envio (UX.md §6.3). */
function AttachmentSection({ taskId, attachments }: {
  taskId: string;
  attachments: { id: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number }[];
}) {
  const notify = useToast();
  const utils = trpc.useUtils();
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const attach = trpc.tasks.addAttachment.useMutation({
    onSuccess: () => { utils.tasks.getById.invalidate(); setFile(null); notify("Evidência anexada."); },
    onError: () => notify("Não foi possível anexar.", "error"),
  });

  async function send() {
    if (!file) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/uploads", { method: "POST", headers: { "x-session-token": getToken() ?? "" }, body: fd });
      if (!res.ok) throw new Error(await res.text());
      const meta = await res.json();
      attach.mutate({ taskId, fileUrl: meta.fileUrl, fileName: meta.fileName, mimeType: meta.mimeType, fileSize: meta.fileSize });
    } catch {
      notify("Não foi possível enviar o arquivo.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold text-on-surface"><Paperclip size={16} className="text-primary" /> Evidências e anexos ({attachments.length})</h2>
      {attachments.length > 0 ? (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-on-surface">{a.fileName}</span>
                <span className="block text-xs text-on-surface-variant">{a.mimeType} · {formatBytes(a.fileSize)}</span>
              </span>
              <a href={a.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-primary">Abrir</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-on-surface-variant">Nenhuma evidência anexada.</p>
      )}
      <div className="mt-3 space-y-2">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" aria-label="Escolher arquivo" />
        {file && <p className="text-xs text-on-surface-variant">{file.name} · {file.type || "tipo desconhecido"} · {formatBytes(file.size)}</p>}
        <button onClick={send} disabled={!file || sending || attach.isPending} className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {sending || attach.isPending ? "Enviando…" : "Anexar evidência"}
        </button>
      </div>
    </section>
  );
}
