// Sessão do cliente: token assinado guardado localmente e enviado no header
// `x-session-token`. Sem fallback silencioso — sem token, o backend responde 401.
import type { MemberRole } from "@hubagendor/shared";

const TOKEN_KEY = "hub.token";
const USER_KEY = "hub.user";

export interface StoredUser {
  id: string;
  name: string;
  role: MemberRole;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: StoredUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage indisponível */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* storage indisponível */
  }
}
