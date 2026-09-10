import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc.js";
import { EmptyState, LoadingState, PageHeader } from "../components/ui.js";

export function TeamPage() {
  const members = trpc.organization.getMembers.useQuery();
  if (members.isPending) return <LoadingState />;
  return (
    <div>
      <PageHeader title="Equipe" subtitle="Quem está com o quê" />
      <ul className="space-y-2">
        {members.data?.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-2xl border bg-white p-4">
            <span><strong>{m.name}</strong> <span className="text-xs text-neutral-500">({m.role})</span></span>
            <Link to={`/app/tasks?assignee=${m.id}`} className="text-sm font-semibold text-accent-700">Ver tarefas</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ClientsPage() {
  const clients = trpc.clients.list.useQuery();
  if (clients.isPending) return <LoadingState />;
  return (
    <div>
      <PageHeader title="Clientes" subtitle="Cadastro simples" />
      <ul className="space-y-2">
        {clients.data?.map((c: { id: string; name: string }) => (
          <li key={c.id} className="rounded-2xl border bg-white p-4 font-semibold">{c.name}</li>
        ))}
      </ul>
    </div>
  );
}

export function NotificationsPage() {
  const list = trpc.notifications.list.useQuery();
  if (list.isPending) return <LoadingState />;
  if (!list.data || list.data.items.length === 0) {
    return <div><PageHeader title="Notificações" /><EmptyState title="Nada por aqui" hint="Atribuições, cobranças e conclusões aparecem aqui." /></div>;
  }
  return <div><PageHeader title="Notificações" /><p>...</p></div>;
}

export function SettingsPage() {
  return <div><PageHeader title="Configurações" subtitle="Preferências e sessão" /><p className="text-sm text-neutral-500">Esqueleto: timezone da organização, perfil e sair (Etapa 2).</p></div>;
}

export function MorePage() {
  return (
    <div className="space-y-2">
      <PageHeader title="Mais" />
      {[
        ["/app/clients", "Clientes"],
        ["/app/my-tasks", "Minhas tarefas"],
        ["/app/notifications", "Notificações"],
        ["/app/settings", "Configurações"],
        ["/login", "Sair"],
      ].map(([to, label]) => (
        <Link key={to} to={to} className="touch-target block rounded-2xl border bg-white p-4 font-semibold">{label}</Link>
      ))}
    </div>
  );
}
