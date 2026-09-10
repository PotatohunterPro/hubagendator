// Sessão do cliente. Enquanto a autenticação definitiva não está integrada,
// o backend identifica o usuário pelo header `x-user-id`. Sem header válido,
// o servidor responde UNAUTHORIZED (não há fallback silencioso — plano2.0 §6.8).
const KEY = "hub.userId";

export function getUserId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setUserId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage indisponível */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage indisponível */
  }
}

/** Personas de desenvolvimento — exibidas apenas em build de desenvolvimento. */
export const DEV_PERSONAS = [
  { id: "carlos", name: "Carlos", role: "Gestor", email: "carlos@hubsolucao.com.br" },
  { id: "gisele", name: "Gisele", role: "Colaboradora", email: "gisele@hubsolucao.com.br" },
  { id: "wellington", name: "Wellington", role: "Colaborador", email: "wellington@hubsolucao.com.br" },
] as const;

export function isDev(): boolean {
  return import.meta.env.DEV;
}
