import { NavLink, Outlet } from "react-router-dom";
import { Bell, ClipboardList, Home, Plus, Users, MoreHorizontal } from "lucide-react";
import { DesktopSidebar } from "./DesktopSidebar.js";
import { MobileBottomNav } from "./MobileBottomNav.js";

export function AppShell() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl md:flex">
      <DesktopSidebar />
      <div className="flex min-h-dvh flex-1 flex-col pb-24 md:pb-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur">
          <strong className="text-accent-700">HubAgendor</strong>
          <NavLink to="/app/notifications" aria-label="Notificações" className="touch-target grid place-items-center rounded-full p-2 hover:bg-neutral-100">
            <Bell size={20} />
          </NavLink>
        </header>
        <main className="flex-1 px-4 py-4">
          <Outlet />
        </main>
        <NavLink
          to="/app/tasks/new"
          className="touch-target fixed bottom-20 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-3 font-semibold text-white shadow-lg hover:bg-accent-700 md:bottom-8"
        >
          <Plus size={20} /> Nova tarefa
        </NavLink>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export const NAV_ITEMS = [
  { to: "/app", label: "Início", icon: Home, end: true },
  { to: "/app/tasks", label: "Tarefas", icon: ClipboardList },
  { to: "/app/team", label: "Equipe", icon: Users },
  { to: "/app/more", label: "Mais", icon: MoreHorizontal },
];
