import { NavLink } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  Home,
  KanbanSquare,
  Settings,
  Store,
  UserCheck,
  Users,
} from "lucide-react";

const ITEMS = [
  { to: "/app", label: "Início", icon: Home },
  { to: "/app/my-tasks", label: "Minhas tarefas", icon: UserCheck },
  { to: "/app/tasks", label: "Todas as tarefas", icon: ClipboardList },
  { to: "/app/board", label: "Quadro", icon: KanbanSquare },
  { to: "/app/team", label: "Equipe", icon: Users },
  { to: "/app/clients", label: "Clientes", icon: Store },
  { to: "/app/notifications", label: "Notificações", icon: Bell },
  { to: "/app/settings", label: "Configurações", icon: Settings },
];

export function DesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line bg-white p-3 md:block">
      <div className="mb-4 flex items-center px-2 pt-1">
        <img src="/logo.png" alt="HubAgendator" className="h-7 w-auto object-contain" />
      </div>
      <nav aria-label="Navegação desktop">
        <ul className="space-y-0.5">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/app"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-accent-50 font-semibold text-accent-700" : "text-slate-600 hover:bg-slate-100"}`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
