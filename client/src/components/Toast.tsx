// Toast de sucesso/erro — UX §13.4: sempre texto, nunca só cor.
import { createContext, useCallback, useContext, useRef, useState } from "react";

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

const ToastContext = createContext<{ notify: (message: string, kind?: Toast["kind"]) => void }>({
  notify: () => {},
});

export function useToast(): (message: string, kind?: Toast["kind"]) => void {
  return useContext(ToastContext).notify;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const notify = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = ++seq.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex w-full max-w-sm flex-col items-center gap-2 px-4 md:bottom-8">
        {toasts.map((t) => (
          <p
            key={t.id}
            role="status"
            className={`w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white shadow-lg ${
              t.kind === "success" ? "bg-accent-700" : "bg-danger-700"
            }`}
          >
            {t.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
