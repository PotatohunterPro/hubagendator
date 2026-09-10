import { NavLink, Outlet } from "react-router-dom";
import { Bell } from "lucide-react";
import { DesktopSidebar } from "./DesktopSidebar.js";
import { MobileBottomNav } from "./MobileBottomNav.js";
import { trpc } from "../lib/trpc.js";
import { FloatingNewTaskButton } from "./ui.js";

export function AppShell() {
  const notifications = trpc.notifications.list.useQuery({});
  const unread = notifications.data?.unread ?? 0;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl bg-surface md:flex">
      <DesktopSidebar />
      <div className="flex min-h-dvh flex-1 flex-col pb-24 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface/95 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="HubAgendator" className="h-7 w-auto object-contain" />
              <span className="hidden text-[12px] font-medium text-on-surface-variant sm:inline">Gestor (Carlos)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[.06em] text-secondary">Coordenação</span>
              <NavLink to="/app/notifications" aria-label="Notificações" className="relative grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container">
                <Bell size={18} />
                {unread > 0 && <span className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">{unread}</span>}
              </NavLink>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 md:px-8 md:py-7">
          <Outlet />
        </main>
        <FloatingNewTaskButton />
        <MobileBottomNav />
      </div>
    </div>
  );
}

export const NAV_ITEMS = [
  { to: "/app", label: "Início", icon: "home", end: true },
  { to: "/app/tasks", label: "Tarefas", icon: "tasks" },
  { to: "/app/team", label: "Equipe", icon: "team" },
  { to: "/app/more", label: "Mais", icon: "more" },
] as const;
