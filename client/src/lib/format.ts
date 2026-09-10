// Formatação pt-BR de prazos e nomes — UX §7.3, §19.
// Estado nunca comunicado só por cor: atraso sempre tem texto.

export const USER_NAMES: Record<string, string> = {
  carlos: "Carlos",
  gisele: "Gisele",
  wellington: "Wellington",
};

export function userName(id: string | null | undefined): string {
  if (!id) return "Sistema";
  return USER_NAMES[id] ?? id;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Rótulo relativo + data objetiva. Ex.: "Atrasada há 2 dias • 08/09 18:00". */
export function dueLabel(dueAt: string | null, overdue: boolean, now = new Date()): string {
  if (!dueAt) return "Sem prazo";
  const due = new Date(dueAt);
  const time = due.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = due.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (overdue) {
    const days = Math.floor((startOfDay(now).getTime() - startOfDay(due).getTime()) / 86400000);
    if (days <= 0) return `Atrasada hoje • ${time}`;
    if (days === 1) return `Atrasada há 1 dia • ${date}`;
    return `Atrasada há ${days} dias • ${date}`;
  }

  const dayDiff = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86400000);
  if (dayDiff <= 0) return `Vence hoje às ${time}`;
  if (dayDiff === 1) return `Vence amanhã • ${time}`;
  return `Vence ${date} • ${time}`;
}

/** Prazo cai no dia atual (para agrupar "Hoje"). */
export function isDueToday(dueAt: string | null, now = new Date()): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function formatDateTime(iso: string): string {  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
