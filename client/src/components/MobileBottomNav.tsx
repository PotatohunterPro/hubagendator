import { NavLink } from "react-router-dom";
import { CalendarDays, ClipboardList, Home, MoreHorizontal, Users } from "lucide-react";

const ITEMS = [
  { to: "/app", label: "Início", icon: Home, end: true },
  { to: "/app/tasks", label: "Tarefas", icon: ClipboardList, end: false },
  { to: "/app/calendar", label: "Agenda", icon: CalendarDays, end: false },
  { to: "/app/team", label: "Equipe", icon: Users, end: false },
  { to: "/app/more", label: "Mais", icon: MoreHorizontal, end: false },
];

/** Navegação inferior + FAB "Nova tarefa" (ux-teste painel/minhas tarefas). */
export function MobileBottomNav() {
  return (
    <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant bg-surface/95 pb-safe shadow-tier-2 backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${isActive ? "text-primary" : "text-on-surface-variant"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
  );
}
