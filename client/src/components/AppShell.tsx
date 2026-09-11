import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { DesktopSidebar } from "./DesktopSidebar.js";
import { MobileBottomNav } from "./MobileBottomNav.js";
import { trpc } from "../lib/trpc.js";
import { FloatingNewTaskButton } from "./ui.js";
import { getUser } from "../lib/session.js";
import { notifyBrowser, playReminderSound, setSoundEnabled, soundEnabled } from "../lib/sound.js";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor",
  leader: "Líder",
  member: "Colaborador",
};

export function AppShell() {
  const me = trpc.auth.me.useQuery();
  // Poll para receber cobranças sem recarregar a página.
  const notifications = trpc.notifications.list.useQuery({}, { refetchInterval: 15000 });
  const unread = notifications.data?.unread ?? 0;

  const [sound, setSound] = useState(soundEnabled());
  const seenReminders = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // Ao surgir uma cobrança nova (reminder_received não lida), toca o alerta.
  useEffect(() => {
    const items = notifications.data?.items ?? [];
    const reminders = items.filter((n) => n.type === "reminder_received" && !n.readAt);
    if (!initialized.current) {
      reminders.forEach((r) => seenReminders.current.add(r.id));
      initialized.current = true;
      return;
    }
    const fresh = reminders.filter((r) => !seenReminders.current.has(r.id));
    if (fresh.length === 0) return;
    fresh.forEach((r) => seenReminders.current.add(r.id));
    if (soundEnabled()) playReminderSound();
    notifyBrowser(fresh[0].title, fresh[0].body);
  }, [notifications.data]);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playReminderSound();
  }

  const user = me.data?.user ?? getUser();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl bg-surface md:flex">
      <DesktopSidebar />
      <div className="flex min-h-dvh flex-1 flex-col pb-24 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface/95 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="HubAgendator" className="h-7 w-auto object-contain" />
              {user && (
                <span className="hidden text-[12px] font-medium text-on-surface-variant sm:inline">
                  {ROLE_LABEL[user.role] ?? ""} ({user.name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                aria-label={sound ? "Desativar som de cobrança" : "Ativar som de cobrança"}
                title={sound ? "Som de cobrança ativado" : "Som de cobrança desativado"}
                className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
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
