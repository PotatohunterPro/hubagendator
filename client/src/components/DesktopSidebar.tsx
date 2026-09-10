import { NavLink } from "react-router-dom";
import { Bell, ClipboardList, Home, Settings, UserCheck, Users } from "lucide-react";

const ITEMS = [
  { to: "/app", label: "Início", icon: Home },
  { to: "/app/my-tasks", label: "Minhas tarefas", icon: UserCheck },
  { to: "/app/tasks", label: "Todas as tarefas", icon: ClipboardList },
  { to: "/app/team", label: "Equipe", icon: Users },
  { to: "/app/clients", label: "Clientes", icon: ClipboardList },
  { to: "/app/notifications", label: "Notificações", icon: Bell },
  { to: "/app/settings", label: "Configurações", icon: Settings },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-white p-4 md:block">
      <nav aria-label="Navegação desktop">
        <ul className="space-y-1">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/app"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-accent-50 font-semibold text-accent-700" : "text-neutral-600 hover:bg-neutral-100"}`
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
