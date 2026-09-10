import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { DEV_PERSONAS, isDev, setUserId } from "../lib/session.js";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState(isDev() ? "carlos@hubsolucao.com.br" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selected, setSelected] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Atalho de desenvolvimento: mapeia e-mail para persona. Nunca em produção.
    if (isDev()) {
      const persona = DEV_PERSONAS.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (!persona) { setError("E-mail não corresponde a um usuário de desenvolvimento."); setSubmitting(false); return; }
      setUserId(persona.id);
      nav("/app");
      return;
    }
    // Produção: a autenticação definitiva ainda não está integrada.
    setError("Autenticação não configurada neste ambiente. Contate o administrador.");
    setSubmitting(false);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-5 sm:p-8">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-tier-2 sm:p-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/logo.png" alt="HubAgendator" className="h-14 w-auto object-contain" />
          <h1 className="mt-4 text-[28px] font-semibold leading-9 tracking-[-.02em] text-on-surface">HubAgendator</h1>
          <span className="mt-1 text-[13px] font-medium text-secondary">Gestão Operacional Interna</span>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-[12px] text-on-surface-variant">
          <Lock size={14} /> Ambiente restrito • Somente equipe autorizada
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-on-surface" htmlFor="login-email">E-mail corporativo</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-md border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[13px] text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest" />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between"><label className="block text-[13px] font-medium text-on-surface" htmlFor="login-pass">Senha</label><button type="button" onClick={() => setRecovery(true)} className="text-[12px] font-medium text-primary hover:underline">Esqueci minha senha</button></div>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input id="login-pass" type={showPassword ? "text" : "password"} required={!isDev()} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="h-11 w-full rounded-md border border-outline-variant bg-surface-container-low pl-9 pr-10 text-[13px] text-on-surface outline-none focus:border-primary focus:bg-surface-container-lowest" />
              <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <button disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-container font-semibold text-on-primary transition hover:bg-primary active:scale-[0.99]">
            {submitting ? "Autenticando sessão..." : "Entrar na Operação"} <ArrowRight size={16} />
          </button>
        </form>

        {isDev() && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-outline">
              <span className="h-px flex-1 bg-outline-variant" /> Atalhos de Homologação <span className="h-px flex-1 bg-outline-variant" />
            </div>
            <div className="space-y-1.5">
              {DEV_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setEmail(p.email); setSelected(p.name); setError(""); }}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${selected === p.name ? "border-primary bg-primary-fixed" : "border-transparent bg-surface-container-low hover:bg-surface-container"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-fixed text-[11px] font-bold text-on-primary-fixed">
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-on-surface">{p.name} ({p.role})</span>
                      <span className="block truncate text-[11px] text-on-surface-variant">{p.email}</span>
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-on-surface-variant" />
                </button>
              ))}
            </div>
          </div>
        )}
        {selected && <p className="mt-3 text-center text-[12px] text-secondary">Perfil selecionado: {selected}</p>}
        <p className="mt-6 text-center text-[11px] leading-4 text-on-surface-variant">HubAgendator v2.4 • Criptografia ponta a ponta<br />© Hub Soluções Integradas • Suporte Técnico: ramal 4022</p>
        {recovery && <p role="status" className="mt-3 rounded-md bg-primary-fixed px-3 py-2 text-center text-[12px] text-on-primary-fixed">Instruções de recuperação enviadas ao e-mail institucional cadastrado.</p>}
      </div>
    </div>
  );
}
