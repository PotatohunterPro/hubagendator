import { NavLink, Outlet } from "react-router-dom";
import { Bell } from "lucide-react";
import { DesktopSidebar } from "./DesktopSidebar.js";
import { MobileBottomNav } from "./MobileBottomNav.js";
import { trpc } from "../lib/trpc.js";

/** Marca da HUB — logo oficial (client/public/logo.png). */
function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <img src="/logo.png" alt="HubAgendator" className="h-7 w-auto object-contain" />
    </span>
  );
}

export function AppShell() {
  const notifications = trpc.notifications.list.useQuery({});
  const unread = notifications.data?.unread ?? 0;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl md:flex">
      <DesktopSidebar />
      <div className="flex min-h-dvh flex-1 flex-col pb-24 md:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2.5 backdrop-blur-xl">
          <BrandMark />
          <NavLink
            to="/app/notifications"
            aria-label={unread > 0 ? `Notificações, ${unread} não lidas` : "Notificações"}
            className="touch-target relative grid place-items-center rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[16px] place-items-center rounded-full bg-danger-600 px-1 text-[10px] font-bold leading-4 text-white tnum">
                {unread}
              </span>
            )}
          </NavLink>
        </header>
        <main className="flex-1 px-4 py-4">
          <Outlet />
        </main>
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
