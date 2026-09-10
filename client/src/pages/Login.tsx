import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const nav = useNavigate();
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-sm place-items-center p-6">
      <form
        className="w-full space-y-3 rounded-2xl border bg-white p-6 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); nav("/app"); }}
      >
        <h1 className="text-xl font-bold text-accent-700">HubAgendor</h1>
        <p className="text-sm text-neutral-500">Gestão operacional mobile-first</p>
        <label className="block text-sm">
          E-mail
          <input required type="email" placeholder="voce@empresa.com" className="touch-target mt-1 w-full rounded-xl border px-3" />
        </label>
        <label className="block text-sm">
          Senha
          <input required type="password" className="touch-target mt-1 w-full rounded-xl border px-3" />
        </label>
        <button className="touch-target w-full rounded-xl bg-accent-600 py-3 font-semibold text-white">Entrar</button>
        <p className="text-xs text-neutral-400">Esqueleto: login real na Etapa 2 (sessão integrada).</p>
      </form>
    </div>
  );
}
