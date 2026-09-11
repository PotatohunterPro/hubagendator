import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Lock, User } from "lucide-react";
import { trpc } from "../lib/trpc.js";
import { setSession } from "../lib/session.js";

export function LoginPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setSession(data.token, { id: data.user.id, name: data.user.name, role: data.user.role });
      nav("/app");
    },
    onError: (e) => setError(e.message || "Nome ou senha inválidos."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !password) {
      setError("Informe nome e senha.");
      return;
    }
    login.mutate({ name: name.trim(), password });
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-6">
      <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-tier-2">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/logo.png" alt="HubAgendator" className="h-12 w-auto object-contain" />
          <span className="mt-3 text-[11px] font-semibold uppercase tracking-[.08em] text-secondary">Gestão Operacional Interna</span>
        </div>

        <div className="mb-5 flex items-center justify-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-[12px] text-on-surface-variant">
          <Lock size={14} /> Ambiente restrito • Somente equipe autorizada
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-on-surface" htmlFor="login-name">Nome</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input id="login-name" autoComplete="username" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="h-11 w-full rounded-md border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[13px] outline-none focus:border-primary focus:bg-surface-container-lowest" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-on-surface" htmlFor="login-pass">Senha</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input id="login-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-md border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[13px] outline-none focus:border-primary focus:bg-surface-container-lowest" />
            </div>
          </div>
          {error && <p role="alert" className="text-[13px] text-error">{error}</p>}
          <button disabled={login.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-container font-semibold text-on-primary active:scale-[0.99] disabled:opacity-50">
            {login.isPending ? "Entrando…" : "Entrar na operação"} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
