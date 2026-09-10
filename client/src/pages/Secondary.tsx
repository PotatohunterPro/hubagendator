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
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Equipe Operacional" subtitle="Capacidade atual e distribuição de demandas em tempo real." action={<span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-1 text-[11px] font-semibold text-on-primary-fixed"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Ao Vivo</span>} />
      <section className="rounded-lg border border-primary-fixed bg-primary-fixed/55 p-4 shadow-tier-1">
        <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-on-primary-fixed">Pressão de Carga da Frota</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <strong className="text-[22px] font-semibold text-on-surface">25 demandas ativas / 4 operadores</strong>
          <span className="text-[12px] text-on-surface-variant">11 em rota · 9 p/ hoje · 3 atrasos operacionais</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-lowest"><div className="h-full w-2/3 rounded-full bg-primary-container" /></div>
      </section>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["Todas as equipes (3)", "Suporte Técnico", "Infraestrutura", "Sistemas & PDV"].map((label, i) => <button key={label} className={`h-9 shrink-0 rounded-full border px-3 text-[13px] font-medium ${i === 0 ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"}`}>{label}</button>)}
      </div>
      {workload.data.length === 0 ? (
        <EmptyState title="Sem equipe" hint="Adicione membros para distribuir tarefas." />
      ) : (
        <ul className="space-y-3">
          {workload.data.map((m) => {
            const bar = m.overdue > 0 ? "bg-error" : m.dueToday > 0 ? "bg-primary-container" : "bg-outline-variant";
            return (
              <li key={m.id} className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-tier-1">
                <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden />
                <div className="p-3 pl-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AssigneeAvatar name={m.name} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface">{m.name}</p>
                        <span className="text-[12px] text-on-surface-variant">{ROLE_LABEL[m.role]}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-semibold text-on-surface tnum">{m.open}</span>
                      <span className="text-[10px] uppercase tracking-wide text-on-surface-variant">ativas</span>
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <Pill dot="bg-primary" label="Em andamento" value={m.inProgress} />
                    <Pill dot="bg-error" label="Atrasadas" value={m.overdue} danger />
                    <Pill dot="bg-primary-container" label="Vencem hoje" value={m.dueToday} />
                    <Pill dot="bg-secondary" label="Concluídas hoje" value={m.completedToday} />
                  </div>
                  <Link to={`/app/tasks?assignee=${m.id}`} className="mt-2.5 flex items-center justify-center gap-1 rounded-md bg-surface-container py-2 text-[13px] font-medium text-on-surface hover:bg-surface-container-high">
                    Ver {m.open} tarefas de {m.name.split(" ")[0]} <ChevronRight size={15} />
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
    <div className="flex items-center justify-between rounded-md bg-surface-container-low px-2 py-1.5">
      <span className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
        <span className={`h-2 w-2 rounded-full ${dot}`} /> {label}
      </span>
      <span className={`text-[13px] font-bold tnum ${danger && value > 0 ? "text-error" : "text-on-surface"}`}>{value}</span>
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
  const card = "rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm";
  const field = "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm outline-none focus:border-primary focus:bg-surface-container-lowest";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Clientes"
        subtitle="Contexto das tarefas — o cliente não acessa o sistema."
        action={<button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-2 text-sm font-semibold text-on-primary"><Plus size={16} /> Novo cliente</button>}
      />

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente…" className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary" />
      </div>

      {showForm && (
        <div className={`${card} mb-3 space-y-2`}>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome *" />
          <input className={field} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa" />
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
          <button onClick={() => { if (!name.trim()) { notify("Informe o nome.", "error"); return; } create.mutate({ name, company: company || undefined, phone: phone || undefined }); }} disabled={create.isPending} className="w-full rounded-lg bg-primary-container py-2.5 font-semibold text-on-primary disabled:opacity-50">
            {create.isPending ? "Salvando…" : "Cadastrar cliente"}
          </button>
        </div>
      )}

      {clients.isPending ? <LoadingState /> :
        clients.isError ? <ErrorState message="Não foi possível carregar clientes." onRetry={() => clients.refetch()} /> :
        items.length === 0 ? (
          <EmptyState title="Ainda não há clientes" hint="Cadastre o primeiro cliente para associar contexto às tarefas." action={<button onClick={() => setShowForm(true)} className="font-semibold text-primary">Cadastrar primeiro cliente</button>} />
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-fixed text-primary"><Store size={18} /></span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-on-surface">{c.name}</p>
                    <p className="truncate text-xs text-on-surface-variant">{[c.company, c.phone].filter(Boolean).join(" · ") || "Sem dados de contato"}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant tnum">{c.openTasks} tarefas</span>
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
      <Link to="/app/clients" className="mb-2 inline-flex items-center gap-1 text-sm text-primary"><ArrowLeft size={15} /> Clientes</Link>
      <PageHeader title={c.name} subtitle={[c.company, c.phone, c.email].filter(Boolean).join(" · ") || "Sem dados de contato"} />
      <h2 className="mb-2 text-[15px] font-semibold text-on-surface">Tarefas relacionadas</h2>
      {c.tasks.length === 0 ? (
        <EmptyState title="Nenhuma tarefa vinculada" hint="Crie uma tarefa e selecione este cliente." />
      ) : (
        <ul className="space-y-2">
          {c.tasks.map((t) => (
            <li key={t.id}>
              <Link to={`/app/tasks/${t.id}`} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm shadow-sm">
                <span className="truncate font-medium text-on-surface">{t.title}</span>
                <ChevronRight size={16} className="shrink-0 text-outline" />
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
  task_assigned: { cat: "atribuicao", label: "Nova Tarefa Atribuída", cls: "bg-primary-fixed text-on-primary-fixed", icon: UserPlus },
  task_reassigned: { cat: "atribuicao", label: "Nova Tarefa Atribuída", cls: "bg-primary-fixed text-on-primary-fixed", icon: UserPlus },
  comment_added: { cat: "comentario", label: "Comentário Adicionado", cls: "bg-surface-container text-on-surface-variant", icon: Bell },
  task_completed: { cat: "conclusao", label: "Tarefa Concluída", cls: "bg-secondary-fixed text-on-secondary-fixed", icon: CheckCheck },
  task_reopened: { cat: "reabertura", label: "Atualização Solicitada", cls: "bg-primary-fixed text-on-primary-fixed", icon: Archive },
  reminder_received: { cat: "cobranca", label: "Atualização Solicitada", cls: "bg-secondary-fixed text-on-secondary-fixed", icon: Bell },
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
    `flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition ${active ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notificações"
        subtitle="Atualizações operacionais em tempo real."
        action={list.data.unread > 0 ? <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-medium text-primary"><CheckCheck size={16} /> Marcar lidas</button> : undefined}
      />
      <div className="mb-4 flex items-center justify-between rounded-lg border border-error-container bg-error-container/45 px-4 py-3">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.05em] text-on-error-container">Fila Operacional</p><p className="mt-0.5 text-[13px] font-medium text-on-error-container">1 item crítico requer despacho imediato</p></div>
        <span className="rounded-full bg-error px-2 py-1 text-[10px] font-bold uppercase text-on-error">Ativo</span>
      </div>

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
            const meta = CATEGORY[n.type] ?? { cat: "outro" as const, label: n.type, cls: "bg-surface-container text-on-surface-variant", icon: Bell };
            const Icon = meta.icon;
            return (
              <li key={n.id} className={`rounded-lg border bg-surface-container-lowest p-4 shadow-tier-1 ${n.readAt ? "border-outline-variant opacity-80" : "border-primary-fixed"}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.cls}`}><Icon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{meta.label}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-outline tnum">
                        {formatDateTime(n.createdAt)}
                        {!n.readAt && <span className="h-2 w-2 rounded-full bg-error" aria-label="Não lida" />}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-on-surface">{n.title}</p>
                    <p className="text-sm text-on-surface-variant">{n.body}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {n.taskId && <Link to={`/app/tasks/${n.taskId}`} className="rounded-md bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary">{meta.cat === "cobranca" ? "Cobrar Atualização" : meta.cat === "atribuicao" ? "Iniciar Tarefa" : "Ver Tarefa"}</Link>}
                      {!n.readAt && <button onClick={() => markRead.mutate({ id: n.id })} className="rounded-md border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant">Marcar lida</button>}
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
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        {org.isPending ? <LoadingState /> : org.data ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-on-surface-variant">Organização</dt><dd className="font-medium">{org.data.name}</dd></div>
            <div className="flex justify-between"><dt className="text-on-surface-variant">Fuso horário</dt><dd className="font-medium">{org.data.timezone}</dd></div>
          </dl>
        ) : <ErrorState message="Não foi possível carregar a organização." />}
        <button onClick={() => { clearSession(); nav("/login"); }} className="mt-4 w-full rounded-lg border border-outline-variant py-2.5 text-sm font-semibold text-error">Sair</button>
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
            <Link to={to} className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 font-medium shadow-sm">
              {label} <ChevronRight size={16} className="text-outline" />
            </Link>
          </li>
        ))}
        <li>
          <button onClick={() => { clearSession(); nav("/login"); }} className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left font-medium text-error shadow-sm">Sair</button>
        </li>
      </ul>
    </div>
  );
}
