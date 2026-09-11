// Token de sessão stateless assinado com HMAC (sem cookie, sem dependência).
import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 30 * 24 * 3600 * 1000; // 30 dias

function secret(): string {
  // Lido em tempo de chamada (dotenv já carregado pelo app).
  return process.env.SESSION_SECRET ?? "dev-insecure-secret-troque-em-producao";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | null | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: string; iat?: number };
    if (!data.uid || !data.iat || Date.now() - data.iat > TTL_MS) return null;
    return data.uid;
  } catch {
    return null;
  }
}
