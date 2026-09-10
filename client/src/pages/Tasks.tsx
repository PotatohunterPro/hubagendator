import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { TaskOrigin, TaskStatus } from "@hubagendor/shared";
import { ORIGIN_LABEL, taskOrigins } from "@hubagendor/shared";
import { trpc } from "../lib/trpc.js";
import { dueLabel, formatDateTime, isDueToday, userName } from "../lib/format.js";
import { AttentionSection, CommentTimeline, EMPTY_FILTERS, TaskFilters, TaskList, type TaskFilterValue, type TaskListItem } from "../components/tasks.js";
import { EmptyState, ErrorState, LoadingState, PageHeader, PriorityBadge, TaskStatusBadge } from "../components/ui.js";
import { useToast } from "../components/Toast.js";

const VALID_STATUS = ["todo", "in_progress", "completed"] as const;

export function TasksPage({ scope }: { scope: "all" | "mine" }) {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<TaskFilterValue>({
    ...EMPTY_FILTERS,
    overdueOnly: params.get("overdueOnly") === "1",
    status: (VALID_STATUS as readonly string[]).includes(params.get("status") ?? "")
      ? (params.get("status") as TaskStatus)
      : "",
  });
  const due = params.get("due");
  const list = trpc.tasks.list.useQuery({
    scope,
    search: filters.search,
    overdueOnly: filters.overdueOnly,
    status: filters.status || undefined,
    due: due === "today" || due === "none" ? due : undefined,
    pageSize: scope === "mine" ? 100 : 20,
  });

  return (
    <div>
      <PageHeader title={scope === "mine" ? "Minhas tarefas" : "Tarefas"} subtitle="Toque para abrir, iniciar e concluir" />
      <TaskFilters value={filters} onChange={setFilters} />
      {list.isPending ? <LoadingState /> :
        list.isError ? <ErrorState message="Não foi possível carregar. Verifique sua conexão e tente novamente." onRetry={() => list.refetch()} /> :
        list.data.items.length === 0 ? <EmptyState title="Não encontramos tarefas com esses filtros" hint="Ajuste a busca ou limpe os filtros." action={<button onClick={() => setFilters(EMPTY_FILTERS)} className="font-semibold text-accent-700">Limpar filtros</button>} /> :
        scope === "mine" ? <MyTasksGroups items={list.data.items} /> : <TaskList tasks={list.data.items} />}
    </div>
  );
}

/** Grupos por urgência operacional — plano2.0 #7. */
function MyTasksGroups({ items }: { items: TaskListItem[] }) {
  const open = (t: TaskListItem) => t.status !== "completed" && t.status !== "archived";
  const overdue = items.filter((t) => t.overdue);
  const today = items.filter((t) => open(t) && !t.overdue && t.dueAt && isDueToday(t.dueAt));
  const inProgress = items.filter((t) => t.status === "in_progress" && !t.overdue && !(t.dueAt && isDueToday(t.dueAt)));
  const upcoming = items.filter((t) => t.status === "todo" && !t.overdue && !(t.dueAt && isDueToday(t.dueAt)));
  const done = items.filter((t) => t.status === "completed").slice(0, 5);

  if (!overdue.length && !today.length && !inProgress.length && !upcoming.length && !done.length) {
    return <EmptyState title="Você não tem tarefas pendentes" hint="Quando Carlos atribuir algo, aparece aqui." />;
  }
  return (
    <div>
      {overdue.length > 0 && <AttentionSection title="Atrasadas"><TaskList tasks={overdue} /></AttentionSection>}
      {today.length > 0 && <AttentionSection title="Hoje"><TaskList tasks={today} /></AttentionSection>}
      {inProgress.length > 0 && <AttentionSection title="Em andamento"><TaskList tasks={inProgress} /></AttentionSection>}
      {upcoming.length > 0 && <AttentionSection title="Próximas"><TaskList tasks={upcoming} /></AttentionSection>}
      {done.length > 0 && <AttentionSection title="Concluídas"><TaskList tasks={done} /></AttentionSection>}
    </div>
  );
}

export function NewTaskPage() {
  const nav = useNavigate();
  const utils = trpc.useUtils();
  const notify = useToast();
  const [created, setCreated] = useState<{ id: string; title: string; assigneeId: string } | null>(null);
  const create = trpc.tasks.create.useMutation({
    onSuccess: (task) => {
      utils.tasks.list.invalidate();
      utils.tasks.getSummary.invalidate();
      notify(`Tarefa criada para ${userName(task.assigneeId)}.`);
      setCreated({ id: task.id, title: task.title, assigneeId: task.assigneeId });
    },
    onError: () => notify("Não foi possível salvar. Verifique sua conexão.", "error"),
  });
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("gisele");
  const [origin, setOrigin] = useState<"" | TaskOrigin>("");

  // Pós-criação sem beco sem saída (UX §2.7, §5.2 item 8).
  if (created) {
    return (
      <div className="space-y-3 text-center">
        <p role="status" className="rounded-2xl bg-accent-50 p-6 font-semibold text-accent-800">
          Tarefa criada para {userName(created.assigneeId)}.
        </p>
        <Link to={`/app/tasks/${created.id}`} className="touch-target block rounded-xl bg-accent-700 py-3 font-semibold text-white">Abrir tarefa</Link>
        <button onClick={() => { setCreated(null); setTitle(""); setOrigin(""); }} className="touch-target block w-full rounded-xl border py-3 font-semibold">Criar outra</button>
        <button onClick={() => nav("/app")} className="touch-target w-full py-3 font-semibold text-neutral-500">Voltar ao painel</button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => { e.preventDefault(); create.mutate({ title, assigneeId, origin: origin || undefined }); }}
    >
      <PageHeader title="Nova tarefa" subtitle="Menos de 1 minuto: título + responsável" />
      <label className="block text-sm">Título*
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200}
          placeholder="Ex.: Mandar cobrança para o Cliente X"
          className="touch-target mt-1 w-full rounded-xl border px-3" />
      </label>
      <label className="block text-sm">Responsável*
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="touch-target mt-1 w-full rounded-xl border bg-white px-3">
          <option value="gisele">Gisele</option>
          <option value="wellington">Wellington</option>
          <option value="carlos">Carlos</option>
        </select>
      </label>
      <label className="block text-sm">Origem (opcional)
        <select value={origin} onChange={(e) => setOrigin(e.target.value as "" | TaskOrigin)} className="touch-target mt-1 w-full rounded-xl border bg-white px-3">
          <option value="">Não informada</option>
          {taskOrigins.map((o) => <option key={o} value={o}>{ORIGIN_LABEL[o]}</option>)}
        </select>
      </label>
      {create.isError && <p role="alert" className="text-sm text-danger-700">Não salvou. O rascunho continua aqui — tente de novo.</p>}
      <button disabled={create.isPending} className="touch-target w-full rounded-xl bg-accent-700 py-3 font-semibold text-white disabled:opacity-50">
        {create.isPending ? "Salvando…" : "Criar tarefa"}
      </button>
    </form>
  );
}

export function TaskDetailPage() {
  const { id } = useParams();
  const notify = useToast();
  const detail = trpc.tasks.getById.useQuery({ id: id ?? "" }, { enabled: !!id });
  const events = trpc.tasks.getEvents.useQuery({ id: id ?? "" }, { enabled: !!id });
  const utils = trpc.useUtils();
  const refresh = () => { utils.tasks.getById.invalidate(); utils.tasks.list.invalidate(); utils.tasks.getSummary.invalidate(); };
  const setStatus = trpc.tasks.setStatus.useMutation({
    onSuccess: (_d, v) => {
      refresh();
      notify(v.status === "completed" ? "Tarefa concluída." : "Tarefa iniciada.");
    },
    onError: () => notify("Você não tem permissão para alterar esta tarefa.", "error"),
  });
  const remind = trpc.tasks.sendReminder.useMutation({
    onSuccess: () => { refresh(); notify("Cobrança enviada."); },
    onError: () => notify("Não foi possível enviar a cobrança.", "error"),
  });
  const addComment = trpc.tasks.addComment.useMutation({
    onSuccess: () => { utils.tasks.getById.invalidate(); notify("Observação adicionada."); },
    onError: () => notify("Não foi possível salvar a observação.", "error"),
  });
  const [comment, setComment] = useState("");

  if (detail.isPending) return <LoadingState />;
  if (detail.isError || !detail.data) return <ErrorState message="Tarefa não encontrada." />;
  const t = detail.data;

  return (
    <div className="space-y-4">
      <PageHeader title={t.title} subtitle={`${userName(t.assigneeId)}${t.clientName ? ` • ${t.clientName}` : ""} • ${t.dueAt ? dueLabel(t.dueAt, t.overdue) : "Sem prazo"}`} />
      <div className="flex flex-wrap gap-2">
        <TaskStatusBadge status={t.status} />
        <PriorityBadge priority={t.priority} />
        {t.origin && <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">Origem: {ORIGIN_LABEL[t.origin]}</span>}
      </div>

      {/* Ação primária por status (UX §9.2) */}
      <div className="flex flex-wrap gap-2">
        {t.status === "todo" && (
          <button onClick={() => setStatus.mutate({ id: t.id, status: "in_progress" })} disabled={setStatus.isPending} className="touch-target flex-1 rounded-xl bg-info-600 px-4 font-semibold text-white disabled:opacity-50">Iniciar tarefa</button>
        )}
        {t.status === "in_progress" && (
          <button onClick={() => setStatus.mutate({ id: t.id, status: "completed" })} disabled={setStatus.isPending} className="touch-target flex-1 rounded-xl bg-accent-700 px-4 font-semibold text-white disabled:opacity-50">Marcar como concluída</button>
        )}
        {(t.status === "todo" || t.status === "in_progress") && (
          <button onClick={() => remind.mutate({ id: t.id })} disabled={remind.isPending} className="touch-target rounded-xl border px-4 font-semibold">Cobrar atualização</button>
        )}
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Comentários</h2>
        <CommentTimeline comments={t.comments} />
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (comment.trim()) { addComment.mutate({ id: t.id, body: comment }); setComment(""); } }}>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ex.: Cliente pediu retorno às 14h"
            className="touch-target min-w-0 flex-1 rounded-xl border px-3" aria-label="Adicionar observação" />
          <button className="touch-target rounded-xl border px-4 font-semibold">Enviar</button>
        </form>
      </section>
      <AttachmentSection taskId={t.id} attachments={t.attachments} />
      <section>
        <h2 className="mb-2 font-semibold">Histórico</h2>
        {events.data?.map((ev) => (
          <p key={ev.id} className="text-xs text-neutral-500">{formatDateTime(ev.createdAt)} — {userName(ev.actorId)} — {ev.eventType}</p>
        ))}
      </section>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Anexos de evidência — nome/tipo/tamanho antes do envio (UX.md §6.3).
 *  Upload binário via fetch /uploads (multipart não cabe no tRPC). */
function AttachmentSection({ taskId, attachments }: {
  taskId: string;
  attachments: { id: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number }[];
}) {
  const notify = useToast();
  const utils = trpc.useUtils();
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const attach = trpc.tasks.addAttachment.useMutation({
    onSuccess: () => { utils.tasks.getById.invalidate(); setFile(null); notify("Evidência anexada."); },
    onError: () => notify("Não foi possível anexar.", "error"),
  });

  async function send() {
    if (!file) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // TODO(login): sessão real; hoje o servidor usa x-user-id dev.
      const res = await fetch("/uploads", { method: "POST", headers: { "x-user-id": "web" }, body: fd });
      if (!res.ok) throw new Error(await res.text());
      const meta = await res.json();
      attach.mutate({ taskId, fileUrl: meta.fileUrl, fileName: meta.fileName, mimeType: meta.mimeType, fileSize: meta.fileSize });
    } catch {
      notify("Não foi possível enviar o arquivo.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 font-semibold">Anexos</h2>
      {attachments.length > 0 ? (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li key={a.id}>
              <a href={a.fileUrl} target="_blank" rel="noreferrer" className="block rounded-xl border bg-white p-3 text-sm">
                <span className="font-semibold">{a.fileName}</span>
                <span className="block text-xs text-neutral-500">{a.mimeType} • {formatBytes(a.fileSize)}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">Nenhuma evidência anexada.</p>
      )}
      <div className="mt-2 space-y-2">
        <label className="block text-sm">
          <span className="sr-only">Escolher arquivo</span>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="touch-target block w-full text-sm" />
        </label>
        {file && <p className="text-xs text-neutral-500">{file.name} • {file.type || "tipo desconhecido"} • {formatBytes(file.size)}</p>}
        <button onClick={send} disabled={!file || sending || attach.isPending} className="touch-target rounded-xl border px-4 font-semibold disabled:opacity-50">
          {sending || attach.isPending ? "Enviando…" : "Anexar evidência"}
        </button>
      </div>
    </section>
  );
}
