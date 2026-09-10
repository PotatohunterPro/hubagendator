import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, Bell, CheckCheck, ChevronRight, Plus, Search, Store, UserPlus } from "lucide-react";
import type { MemberRole } from "@hubagendor/shared";
import { trpc } from "../lib/trpc.js";
import { clearSession } from "../lib/session.js";
import { formatDateTime } from "../lib/format.js";
import { AssigneeAvatar, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/ui.js";
import { useToast } from "../components/Toast.js";

const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  leader: "Líder",
  member: "Colaborador",
};

/* ------------------------------------------------------------- Equipe */

export function TeamPage() {
  const workload = trpc.teams.workload.useQuery();
  if (workload.isPending) return <LoadingState />;
  if (workload.isError) return <ErrorState message="Não foi possível carregar a equipe." onRetry={() => workload.refetch()} />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Equipe" subtitle="Distribuição de demandas em tempo real." />
      {workload.data.length === 0 ? (
        <EmptyState title="Sem equipe" hint="Adicione membros para distribuir tarefas." />
      ) : (
        <ul className="space-y-3">
          {workload.data.map((m) => {
            const bar = m.overdue > 0 ? "bg-danger-600" : m.dueToday > 0 ? "bg-attention-200" : "bg-slate-300";
            return (
              <li key={m.id} className="relative overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden />
                <div className="p-3 pl-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AssigneeAvatar name={m.name} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{m.name}</p>
                        <span className="text-xs text-slate-500">{ROLE_LABEL[m.role]}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-semibold text-slate-900 tnum">{m.open}</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">abertas</span>
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <Pill dot="bg-info-600" label="Em andamento" value={m.inProgress} />
                    <Pill dot="bg-danger-600" label="Atrasadas" value={m.overdue} danger />
                    <Pill dot="bg-attention-200" label="Vencem hoje" value={m.dueToday} />
                    <Pill dot="bg-success-600" label="Concluídas hoje" value={m.completedToday} />
                  </div>
                  <Link to={`/app/tasks?assignee=${m.id}`} className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                    Ver tarefas de {m.name.split(" ")[0]} <ChevronRight size={15} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Pill({ dot, label, value, danger }: { dot: string; label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className={`h-2 w-2 rounded-full ${dot}`} /> {label}
      </span>
      <span className={`text-sm font-bold tnum ${danger && value > 0 ? "text-danger-700" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------- Clientes */

export function ClientsPage() {
  const utils = trpc.useUtils();
  const notify = useToast();
  const clients = trpc.clients.list.useQuery();
  const create = trpc.clients.create.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); notify("Cliente cadastrado."); setShowForm(false); setName(""); setCompany(""); setPhone(""); },
    onError: () => notify("Não foi possível cadastrar o cliente.", "error"),
  });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  const items = (clients.data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const card = "rounded-xl border border-line bg-white p-4 shadow-sm";
  const field = "h-10 w-full rounded-lg border border-line bg-slate-50 px-3 text-sm outline-none focus:border-accent-600 focus:bg-white";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Clientes"
        subtitle="Contexto das tarefas — o cliente não acessa o sistema."
        action={<button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-accent-700 px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> Novo cliente</button>}
      />

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente…" className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:border-accent-600" />
      </div>

      {showForm && (
        <div className={`${card} mb-3 space-y-2`}>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome *" />
          <input className={field} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa" />
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
          <button onClick={() => { if (!name.trim()) { notify("Informe o nome.", "error"); return; } create.mutate({ name, company: company || undefined, phone: phone || undefined }); }} disabled={create.isPending} className="w-full rounded-lg bg-accent-700 py-2.5 font-semibold text-white disabled:opacity-50">
            {create.isPending ? "Salvando…" : "Cadastrar cliente"}
          </button>
        </div>
      )}

      {clients.isPending ? <LoadingState /> :
        clients.isError ? <ErrorState message="Não foi possível carregar clientes." onRetry={() => clients.refetch()} /> :
        items.length === 0 ? (
          <EmptyState title="Ainda não há clientes" hint="Cadastre o primeiro cliente para associar contexto às tarefas." action={<button onClick={() => setShowForm(true)} className="font-semibold text-accent-700">Cadastrar primeiro cliente</button>} />
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-50 text-accent-700"><Store size={18} /></span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{c.name}</p>
                    <p className="truncate text-xs text-slate-500">{[c.company, c.phone].filter(Boolean).join(" · ") || "Sem dados de contato"}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 tnum">{c.openTasks} tarefas</span>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/* ------------------------------------------------------------- Cliente detalhe */

export function ClientDetailPage() {
  const { id } = useParams();
  const client = trpc.clients.getById.useQuery({ id: id ?? "" }, { enabled: !!id });
  if (client.isPending) return <LoadingState />;
  if (client.isError || !client.data) return <ErrorState message="Cliente não encontrado." />;
  const c = client.data;
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/app/clients" className="mb-2 inline-flex items-center gap-1 text-sm text-accent-700"><ArrowLeft size={15} /> Clientes</Link>
      <PageHeader title={c.name} subtitle={[c.company, c.phone, c.email].filter(Boolean).join(" · ") || "Sem dados de contato"} />
      <h2 className="mb-2 text-[15px] font-semibold text-slate-900">Tarefas relacionadas</h2>
      {c.tasks.length === 0 ? (
        <EmptyState title="Nenhuma tarefa vinculada" hint="Crie uma tarefa e selecione este cliente." />
      ) : (
        <ul className="space-y-2">
          {c.tasks.map((t) => (
            <li key={t.id}>
              <Link to={`/app/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-line bg-white p-3 text-sm shadow-sm">
                <span className="truncate font-medium text-slate-800">{t.title}</span>
                <ChevronRight size={16} className="shrink-0 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Notificações */

type NotifCategory = "atribuicao" | "comentario" | "conclusao" | "reabertura" | "cobranca" | "outro";

const CATEGORY: Record<string, { cat: NotifCategory; label: string; cls: string; icon: React.ComponentType<{ size?: number }> }> = {
  task_assigned: { cat: "atribuicao", label: "Nova tarefa atribuída", cls: "bg-accent-50 text-accent-700", icon: UserPlus },
  task_reassigned: { cat: "atribuicao", label: "Tarefa reatribuída", cls: "bg-accent-50 text-accent-700", icon: UserPlus },
  comment_added: { cat: "comentario", label: "Comentário", cls: "bg-slate-100 text-slate-600", icon: Bell },
  task_completed: { cat: "conclusao", label: "Tarefa concluída", cls: "bg-success-100 text-success-700", icon: CheckCheck },
  task_reopened: { cat: "reabertura", label: "Tarefa reaberta", cls: "bg-attention-100 text-attention-800", icon: Archive },
  reminder_received: { cat: "cobranca", label: "Atualização solicitada", cls: "bg-cyan-50 text-cyan-700", icon: Bell },
};

export function NotificationsPage() {
  const utils = trpc.useUtils();
  const list = trpc.notifications.list.useQuery({});
  const markRead = trpc.notifications.markAsRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const markAll = trpc.notifications.markAllAsRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const [filter, setFilter] = useState<"todas" | "nao-lidas" | "cobrancas" | "atribuicoes">("todas");

  if (list.isPending) return <LoadingState />;
  if (list.isError) return <ErrorState message="Não foi possível carregar notificações." onRetry={() => list.refetch()} />;

  const all = list.data.items;
  const items = all.filter((n) => {
    if (filter === "nao-lidas") return !n.readAt;
    const cat = CATEGORY[n.type]?.cat;
    if (filter === "cobrancas") return cat === "cobranca";
    if (filter === "atribuicoes") return cat === "atribuicao";
    return true;
  });

  const pill = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${active ? "bg-accent-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notificações"
        subtitle="Atualizações operacionais em tempo real."
        action={list.data.unread > 0 ? <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-accent-700"><CheckCheck size={16} /> Marcar lidas</button> : undefined}
      />

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <button className={pill(filter === "todas")} onClick={() => setFilter("todas")}>Todas {all.length}</button>
        <button className={pill(filter === "nao-lidas")} onClick={() => setFilter("nao-lidas")}>Não lidas {list.data.unread}</button>
        <button className={pill(filter === "cobrancas")} onClick={() => setFilter("cobrancas")}>Cobranças</button>
        <button className={pill(filter === "atribuicoes")} onClick={() => setFilter("atribuicoes")}>Atribuições</button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Você está em dia" hint="Nenhuma notificação neste filtro." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const meta = CATEGORY[n.type] ?? { cat: "outro" as const, label: n.type, cls: "bg-slate-100 text-slate-600", icon: Bell };
            const Icon = meta.icon;
            return (
              <li key={n.id} className={`rounded-xl border bg-white p-3 shadow-sm ${n.readAt ? "border-line opacity-80" : "border-accent-200"}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.cls}`}><Icon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{meta.label}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400 tnum">
                        {formatDateTime(n.createdAt)}
                        {!n.readAt && <span className="h-2 w-2 rounded-full bg-danger-600" aria-label="Não lida" />}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-sm text-slate-600">{n.body}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {n.taskId && <Link to={`/app/tasks/${n.taskId}`} className="rounded-lg bg-accent-700 px-3 py-1.5 text-xs font-semibold text-white">Ver tarefa</Link>}
                      {!n.readAt && <button onClick={() => markRead.mutate({ id: n.id })} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slate-600">Marcar lida</button>}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Config / Mais */

export function SettingsPage() {
  const org = trpc.organization.getCurrent.useQuery();
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Configurações" subtitle="Organização e sessão." />
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        {org.isPending ? <LoadingState /> : org.data ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Organização</dt><dd className="font-medium">{org.data.name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Fuso horário</dt><dd className="font-medium">{org.data.timezone}</dd></div>
          </dl>
        ) : <ErrorState message="Não foi possível carregar a organização." />}
        <button onClick={() => { clearSession(); nav("/login"); }} className="mt-4 w-full rounded-lg border border-line py-2.5 text-sm font-semibold text-danger-700">Sair</button>
      </div>
    </div>
  );
}

export function MorePage() {
  const nav = useNavigate();
  const links: [string, string][] = [
    ["/app/my-tasks", "Minhas tarefas"],
    ["/app/clients", "Clientes"],
    ["/app/board", "Quadro (Kanban)"],
    ["/app/notifications", "Notificações"],
    ["/app/settings", "Configurações"],
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mais" />
      <ul className="space-y-2">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="flex items-center justify-between rounded-xl border border-line bg-white p-4 font-medium shadow-sm">
              {label} <ChevronRight size={16} className="text-slate-400" />
            </Link>
          </li>
        ))}
        <li>
          <button onClick={() => { clearSession(); nav("/login"); }} className="w-full rounded-xl border border-line bg-white p-4 text-left font-medium text-danger-700 shadow-sm">Sair</button>
        </li>
      </ul>
    </div>
  );
}
