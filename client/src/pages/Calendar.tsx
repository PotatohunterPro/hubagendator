import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Monitor, Plus, TriangleAlert } from "lucide-react";
import type { TaskStatus } from "@hubagendor/shared";
import { trpc } from "../lib/trpc.js";
import { userName } from "../lib/format.js";
import { AssigneeAvatar, EmptyState, ErrorState, LoadingState, PriorityBadge, StatusBadge } from "../components/ui.js";
import { useToast } from "../components/Toast.js";

type View = "day" | "week";
type Scope = "mine" | "team" | "all";

interface AgendaItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: "low" | "normal" | "high" | "urgent";
  assigneeId: string;
  clientName: string | null;
  dueAt: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  location: string | null;
  overdue?: boolean;
  conflict?: boolean;
}

const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const startOfWeek = (d: Date) => { const c = startOfDay(d); const day = (c.getDay() + 6) % 7; return addDays(c, -day); };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const timeRange = (a: string, b: string) => `${hhmm(new Date(a))}–${hhmm(new Date(b))}`;

/** Agenda Operacional — mesma tarefa, visualização por horário (Agenda v1). */
export function CalendarPage() {
  const nav = useNavigate();
  const notify = useToast();
  const utils = trpc.useUtils();
  const members = trpc.organization.getMembers.useQuery();
  const teams = trpc.teams.list.useQuery();

  const [view, setView] = useState<View>("day");
  const [scope, setScope] = useState<Scope>("all");
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [assigneeId, setAssigneeId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [onlyConflicts, setOnlyConflicts] = useState(false);

  const range = useMemo(() => {
    if (view === "week") {
      const from = startOfWeek(date);
      return { from, to: addDays(from, 7), days: Array.from({ length: 7 }, (_, i) => addDays(from, i)) };
    }
    return { from: date, to: addDays(date, 1), days: [date] };
  }, [view, date]);

  const agenda = trpc.tasks.agenda.useQuery({
    from: range.from,
    to: range.to,
    scope,
    assigneeId: assigneeId || undefined,
    teamId: teamId || undefined,
    onlyConflicts,
  });
  const overdue = trpc.tasks.list.useQuery({
    scope: scope === "all" ? "all" : scope === "mine" ? "mine" : "team",
    overdueOnly: true,
    assigneeId: assigneeId || undefined,
    pageSize: 20,
  });

  const setSchedule = trpc.tasks.setSchedule.useMutation({
    onSuccess: () => { utils.tasks.agenda.invalidate(); utils.tasks.list.invalidate(); utils.tasks.getSummary.invalidate(); notify("Horário atualizado."); },
    onError: () => notify("Não foi possível salvar o novo horário.", "error"),
  });

  const scheduled = (agenda.data?.scheduled ?? []) as AgendaItem[];
  const unscheduled = (agenda.data?.unscheduled ?? []) as AgendaItem[];
  const today = startOfDay(new Date());

  const pill = (active: boolean) =>
    `flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${active ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`;

  /** Move um evento: mantém duração, faz snap de 30min, checa conflito e confirma. */
  async function moveTask(taskId: string, newStart: Date) {
    const item = scheduled.find((t) => t.id === taskId);
    if (!item?.scheduledStart || !item.scheduledEnd) return;
    const duration = new Date(item.scheduledEnd).getTime() - new Date(item.scheduledStart).getTime();
    const start = new Date(newStart);
    start.setMinutes(start.getMinutes() < 30 ? 0 : 30, 0, 0);
    const end = new Date(start.getTime() + duration);
    const conflicts = await utils.tasks.checkConflict.fetch({
      assigneeId: item.assigneeId, scheduledStart: start, scheduledEnd: end, excludeTaskId: item.id,
    });
    if (conflicts.length) {
      const ok = window.confirm(`${userName(item.assigneeId)} já possui: ${conflicts.map((c) => `“${c.title}” (${timeRange(c.scheduledStart, c.scheduledEnd)})`).join(", ")}. Manter mesmo assim?`);
      if (!ok) return;
    }
    setSchedule.mutate({ id: item.id, scheduledStart: start, scheduledEnd: end });
  }

  function createAt(day: Date, hour: number, assignee?: string) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:00`;
    nav(`/app/tasks/new?date=${ymd(day)}&start=${start}&end=${end}${assignee ? `&assignee=${assignee}` : ""}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-on-surface">Agenda</h1>
          <p className="mt-0.5 text-[13px] text-on-surface-variant">Quando a equipe vai executar cada atividade.</p>
        </div>
        <div className="flex gap-1.5">
          <button className={pill(view === "day")} onClick={() => setView("day")}>Dia</button>
          <button className={pill(view === "week")} onClick={() => setView("week")}>Semana</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={scope} onChange={(e) => setScope(e.target.value as Scope)} className="h-9 rounded-md border border-outline-variant bg-surface-container-lowest px-2 text-[13px]" aria-label="Escopo">
          <option value="all">Agenda da equipe</option>
          <option value="mine">Minha agenda</option>
          <option value="team">Por equipe</option>
        </select>
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="h-9 rounded-md border border-outline-variant bg-surface-container-lowest px-2 text-[13px]" aria-label="Responsável">
          <option value="">Todos os responsáveis</option>
          {(members.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="h-9 rounded-md border border-outline-variant bg-surface-container-lowest px-2 text-[13px]" aria-label="Equipe">
          <option value="">Todas as equipes</option>
          {(teams.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className={pill(onlyConflicts)} onClick={() => setOnlyConflicts((v) => !v)}>Somente conflitos</button>
      </div>

      {/* Navegação de data */}
      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest p-2 shadow-tier-1">
        <button onClick={() => setDate((d) => addDays(d, view === "week" ? -7 : -1))} className="grid h-9 w-9 place-items-center rounded-md hover:bg-surface-container" aria-label="Anterior"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-on-surface">
            {view === "week"
              ? `${range.days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${range.days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
              : date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <button onClick={() => setDate(today)} className="text-[11px] font-medium text-primary">Hoje</button>
        </div>
        <button onClick={() => setDate((d) => addDays(d, view === "week" ? 7 : 1))} className="grid h-9 w-9 place-items-center rounded-md hover:bg-surface-container" aria-label="Próximo"><ChevronRight size={18} /></button>
      </div>

      {agenda.isPending ? <LoadingState label="Carregando agenda…" /> :
        agenda.isError ? <ErrorState message="Não foi possível carregar a agenda." onRetry={() => agenda.refetch()} /> :
        view === "week" ? (
          <WeekView days={range.days} scheduled={scheduled} onOpen={(id) => nav(`/app/tasks/${id}`)} onSlot={(d, h) => createAt(d, h)} />
        ) : (
          <DayView
            day={date}
            scheduled={scheduled}
            unscheduled={unscheduled}
            overdue={(overdue.data?.items ?? []) as AgendaItem[]}
            onOpen={(id) => nav(`/app/tasks/${id}`)}
            onCreate={(h, assignee) => createAt(date, h, assignee)}
            onMove={moveTask}
          />
        )}
    </div>
  );
}

function EventCard({ item, draggable, onDragStart, onOpen, showDay }: {
  item: AgendaItem; draggable?: boolean; onDragStart?: () => void; onOpen: () => void; showDay?: boolean;
}) {
  const overdue = item.overdue;
  const done = item.status === "completed";
  const bar = done ? "bg-success-600" : overdue ? "bg-error" : item.status === "in_progress" ? "bg-primary" : "bg-primary-container";
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-tier-1 ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden />
      <Link to={`/app/tasks/${item.id}`} onClick={onOpen} className="block p-3 pl-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.scheduledStart && item.scheduledEnd && (
            <span className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] font-semibold text-on-surface-variant tnum">{timeRange(item.scheduledStart, item.scheduledEnd)}</span>
          )}
          <StatusBadge status={item.status} />
          {(item.priority === "high" || item.priority === "urgent") && <PriorityBadge priority={item.priority} />}
          {overdue && <span className="inline-flex items-center gap-1 rounded border border-error-container bg-error-container px-1.5 py-0.5 text-[11px] font-bold uppercase text-on-error-container"><TriangleAlert size={11} /> Atrasada</span>}
          {item.conflict && <span className="inline-flex items-center gap-1 rounded border border-attention-200 bg-attention-100 px-1.5 py-0.5 text-[11px] font-bold uppercase text-attention-800"><TriangleAlert size={11} /> Conflito</span>}
        </div>
        <h3 className="mt-1.5 font-semibold leading-snug text-on-surface">{item.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-on-surface-variant">
          <span className="flex items-center gap-1"><AssigneeAvatar name={userName(item.assigneeId)} size={18} /> {userName(item.assigneeId)}</span>
          {showDay && item.scheduledStart && <span className="tnum">{new Date(item.scheduledStart).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>}
          {item.clientName && <span>{item.clientName}</span>}
          {item.location && <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>}
        </div>
      </Link>
    </div>
  );
}

function DayView({ day, scheduled, unscheduled, overdue, onOpen, onCreate, onMove }: {
  day: Date;
  scheduled: AgendaItem[];
  unscheduled: AgendaItem[];
  overdue: AgendaItem[];
  onOpen: (id: string) => void;
  onCreate: (hour: number, assignee?: string) => void;
  onMove: (taskId: string, start: Date) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = startOfDay(new Date()).getTime() === day.getTime();
  const nowHour = new Date().getHours();
  const byHour = new Map<number, AgendaItem[]>();
  for (const t of scheduled) {
    if (!t.scheduledStart) continue;
    const h = new Date(t.scheduledStart).getHours();
    byHour.set(h, [...(byHour.get(h) ?? []), t]);
  }

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-error"><TriangleAlert size={16} /> Atrasadas</h2>
          <ul className="space-y-2">{overdue.map((t) => <li key={t.id}><EventCard item={t} onOpen={() => onOpen(t.id)} /></li>)}</ul>
        </section>
      )}

      {unscheduled.length > 0 && (
        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-on-surface">Sem horário</h2>
          <ul className="space-y-2">{unscheduled.map((t) => <li key={t.id}><EventCard item={t} onOpen={() => onOpen(t.id)} /></li>)}</ul>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-on-surface">Agenda do dia</h2>
          <span className="hidden items-center gap-1.5 text-[11px] text-on-surface-variant md:flex"><Monitor size={13} /> arraste para reagendar</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-tier-1">
          {hours.map((h) => (
            <div
              key={h}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("text/task"); if (id) onMove(id, new Date(day.getFullYear(), day.getMonth(), day.getDate(), h)); }}
              className={`flex gap-3 border-b border-outline-variant/60 px-3 py-2 last:border-0 ${isToday && h === nowHour ? "bg-primary-fixed/40" : ""}`}
            >
              <span className="w-12 shrink-0 pt-0.5 text-[12px] text-on-surface-variant tnum">{String(h).padStart(2, "0")}:00</span>
              <div className="min-w-0 flex-1 space-y-1.5">
                {byHour.get(h)?.map((t) => (
                  <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}>
                    <EventCard item={t} draggable onOpen={() => onOpen(t.id)} />
                  </div>
                ))}
                <button onClick={() => onCreate(h)} className="hidden items-center gap-1 text-[12px] text-on-surface-variant hover:text-primary md:inline-flex">
                  <Plus size={13} /> Nova tarefa às {String(h).padStart(2, "0")}:00
                </button>
              </div>
            </div>
          ))}
        </div>
        {scheduled.length === 0 && (
          <div className="mt-2"><EmptyState title="Nenhuma atividade agendada para este dia" hint="Use “Nova tarefa” para agendar em um horário." /></div>
        )}
      </section>
    </div>
  );
}

function WeekView({ days, scheduled, onOpen, onSlot }: {
  days: Date[];
  scheduled: AgendaItem[];
  onOpen: (id: string) => void;
  onSlot: (day: Date, hour: number) => void;
}) {
  const [mobileDay, setMobileDay] = useState(() => startOfDay(new Date()).getTime());
  const activeDay = days.find((d) => d.getTime() === mobileDay) ?? days[0];
  const byDay = (d: Date) => scheduled.filter((t) => t.scheduledStart && startOfDay(new Date(t.scheduledStart)).getTime() === d.getTime());

  return (
    <div>
      {/* Mobile: abas por dia + lista */}
      <div className="md:hidden">
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {days.map((d) => (
            <button key={d.toISOString()} onClick={() => setMobileDay(d.getTime())} className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border text-[11px] ${d.getTime() === activeDay.getTime() ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"}`}>
              <span className="uppercase">{d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}</span>
              <span className="text-[13px] font-semibold tnum">{d.getDate()}</span>
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {byDay(activeDay).map((t) => <li key={t.id}><EventCard item={t} onOpen={() => onOpen(t.id)} /></li>)}
          {byDay(activeDay).length === 0 && <EmptyState title="Nenhuma atividade neste dia" hint="Toque em outro dia para navegar." />}
        </ul>
      </div>

      {/* Desktop: colunas por dia */}
      <div className="hidden gap-2 md:grid md:grid-cols-7">
        {days.map((d) => (
          <div key={d.toISOString()} className="rounded-lg border border-outline-variant bg-surface-container-low/50 p-1.5">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase text-on-surface-variant">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
              <span className="text-[12px] font-semibold text-on-surface tnum">{d.getDate()}</span>
            </div>
            <div className="space-y-1.5">
              {byDay(d).map((t) => (
                <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}>
                  <EventCard item={t} draggable showDay onOpen={() => onOpen(t.id)} />
                </div>
              ))}
            </div>
            <button onClick={() => onSlot(d, 9)} className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-outline-variant py-1 text-[11px] text-on-surface-variant hover:bg-surface-container">
              <Plus size={12} /> agendar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
