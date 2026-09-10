import { NavLink } from "react-router-dom";
import { ClipboardList, Home, MoreHorizontal, Plus, Users } from "lucide-react";

const ITEMS = [
  { to: "/app", label: "Início", icon: Home, end: true },
  { to: "/app/tasks", label: "Tarefas", icon: ClipboardList, end: false },
  { to: "/app/team", label: "Equipe", icon: Users, end: false },
  { to: "/app/more", label: "Mais", icon: MoreHorizontal, end: false },
];

/** Navegação inferior + FAB "Nova tarefa" (ux-teste painel/minhas tarefas). */
export function MobileBottomNav() {
  return (
    <>
      <NavLink
        to="/app/tasks/new"
        className="touch-target fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-accent-700 px-4 py-3 font-semibold text-white shadow-[0_4px_16px_rgba(0,63,135,0.28)] active:scale-95 md:hidden"
      >
        <Plus size={20} /> Nova tarefa
      </NavLink>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 pb-safe backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-4">
          {ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${isActive ? "text-accent-700" : "text-slate-500"}`
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
    </>
  );
}
