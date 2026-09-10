import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, KeyRound, Mail } from "lucide-react";
import { DEV_PERSONAS, isDev, setUserId } from "../lib/session.js";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState(isDev() ? "carlos@hubsolucao.com.br" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Atalho de desenvolvimento: mapeia e-mail para persona. Nunca em produção.
    if (isDev()) {
      const persona = DEV_PERSONAS.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (!persona) { setError("E-mail não corresponde a um usuário de desenvolvimento."); return; }
      setUserId(persona.id);
      nav("/app");
      return;
    }
    // Produção: a autenticação definitiva ainda não está integrada.
    setError("Autenticação não configurada neste ambiente. Contate o administrador.");
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/logo.png" alt="HubAgendator" className="h-12 w-auto object-contain" />
          <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-cyan-600">Gestão Operacional Interna</span>
        </div>

        <div className="mb-5 flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <Lock size={14} /> Ambiente restrito • Somente equipe autorizada
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="login-email">E-mail corporativo</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-accent-600 focus:bg-white" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="login-pass">Senha</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="login-pass" type="password" required={!isDev()} value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-accent-600 focus:bg-white" />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
          <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent-700 font-semibold text-white active:scale-[0.99]">
            Entrar na operação <ArrowRight size={16} />
          </button>
        </form>

        {isDev() && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-line" /> Atalhos de desenvolvimento <span className="h-px flex-1 bg-line" />
            </div>
            <div className="space-y-1.5">
              {DEV_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setUserId(p.id); nav("/app"); }}
                  className="flex w-full items-center justify-between rounded-lg bg-slate-50 p-2 text-left hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-50 text-[11px] font-bold text-accent-700">
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{p.name} ({p.role})</span>
                      <span className="block truncate text-[11px] text-slate-400">{p.email}</span>
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
