import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NewTaskPage, TaskDetailPage, TasksPage } from "./Tasks.js";
import { lastQueryInput, resetTrpcMock, setMutation, setQuery } from "../test/trpcMock.js";

// plano2.0 §39 (frontend): criação pelo celular, filtro atrasado, conclusão,
// erro de rede, loading, empty state, navegação e largura 360px.
vi.mock("../lib/trpc.js", async () => {
  const mock = await import("../test/trpcMock.js");
  return { trpc: mock.trpc };
});

beforeEach(() => resetTrpcMock());

const emptyList = { items: [], total: 0, page: 1, pageSize: 20 };
const task = {
  id: "t1",
  title: "Mandar cobrança para o Cliente X",
  status: "todo",
  priority: "high",
  assigneeId: "gisele",
  clientName: "Cliente X",
  dueAt: null,
  overdue: false,
};

function renderList(scope: "all" | "mine" = "all") {
  return render(
    <MemoryRouter initialEntries={["/app/tasks"]}>
      <Routes>
        <Route path="*" element={<TasksPage scope={scope} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TasksPage — estados", () => {
  it("mostra loading (skeleton) enquanto carrega", () => {
    setQuery("tasks.list", { isPending: true });
    renderList();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("mostra erro de rede acionável", () => {
    setQuery("tasks.list", { isError: true });
    renderList();
    expect(screen.getByText(/Não foi possível carregar/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tentar de novo/ })).toBeTruthy();
  });

  it("mostra empty state quando não há tarefas", () => {
    setQuery("tasks.list", { data: emptyList });
    renderList();
    expect(screen.getByText(/Não encontramos tarefas/)).toBeTruthy();
  });

  it("renderiza a lista com dados reais", () => {
    setQuery("tasks.list", { data: { ...emptyList, items: [task], total: 1 } });
    renderList();
    expect(screen.getByText(task.title)).toBeTruthy();
  });
});

describe("TasksPage — filtro de atrasadas", () => {
  it("ao tocar em Atrasadas envia overdueOnly=true para a API", () => {
    setQuery("tasks.list", { data: emptyList });
    renderList();
    expect(lastQueryInput("tasks.list").overdueOnly).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Atrasadas/ }));
    expect(lastQueryInput("tasks.list").overdueOnly).toBe(true);
  });
});

describe("TasksPage — navegação", () => {
  it("o card aponta para o detalhe da tarefa", () => {
    setQuery("tasks.list", { data: { ...emptyList, items: [task], total: 1 } });
    renderList();
    const link = screen.getByRole("link", { name: /Mandar cobrança para o Cliente X/ });
    expect(link.getAttribute("href")).toBe("/app/tasks/t1");
  });
});

describe("TasksPage — largura 360px", () => {
  it("renderiza o conteúdo principal em viewport de 360px", () => {
    const original = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 360 });
    setQuery("tasks.list", { data: { ...emptyList, items: [task], total: 1 } });
    renderList();
    expect(screen.getByText("Tarefas")).toBeTruthy();
    expect(screen.getByText(task.title)).toBeTruthy();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: original });
  });
});

describe("NewTaskPage — criação pelo celular", () => {
  function renderNew() {
    return render(
      <MemoryRouter initialEntries={["/app/tasks/new"]}>
        <Routes>
          <Route path="*" element={<NewTaskPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("cria a tarefa com título e responsável selecionados", () => {
    setQuery("organization.getMembers", {
      data: [
        { id: "gisele", name: "Gisele", role: "member", active: true },
        { id: "wellington", name: "Wellington", role: "member", active: true },
      ],
    });
    setQuery("teams.list", { data: [] });
    setQuery("clients.list", { data: [] });
    const mutate = vi.fn();
    setMutation("tasks.create", { mutate });

    renderNew();
    fireEvent.change(screen.getByLabelText(/Título da Demanda/), { target: { value: "Mandar cobrança para o Cliente X" } });
    fireEvent.click(screen.getByRole("button", { name: /Gisele/ }));
    fireEvent.click(screen.getByRole("button", { name: /Criar e Atribuir Tarefa/ }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mandar cobrança para o Cliente X", assigneeId: "gisele" }),
    );
  });

  it("avisa conflito de horário do responsável sem bloquear", () => {
    setQuery("organization.getMembers", { data: [{ id: "gisele", name: "Gisele", role: "member", active: true }] });
    setQuery("teams.list", { data: [] });
    setQuery("clients.list", { data: [] });
    setQuery("tasks.checkConflict", {
      data: [{ id: "c1", title: "Outra atividade", scheduledStart: "2026-09-12T13:00:00.000Z", scheduledEnd: "2026-09-12T14:00:00.000Z", location: null }],
    });

    const { container } = renderNew();
    fireEvent.click(screen.getByRole("button", { name: /Gisele/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sim" }));
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: "2026-09-12" } });
    fireEvent.change(container.querySelectorAll('input[type="time"]')[0], { target: { value: "10:00" } });
    fireEvent.change(container.querySelectorAll('input[type="time"]')[1], { target: { value: "11:00" } });

    expect(screen.getByText(/já possui outra atividade neste horário/)).toBeTruthy();
    expect(screen.getByText(/Outra atividade/)).toBeTruthy();
  });
});

describe("TaskDetailPage — fluxo de conclusão", () => {
  it("conclui a tarefa em andamento chamando setStatus(completed)", () => {
    setQuery("tasks.getById", {
      data: { ...task, status: "in_progress", origin: null, description: null, comments: [], attachments: [] },
    });
    setQuery("tasks.getEvents", { data: [] });
    const mutate = vi.fn();
    setMutation("tasks.setStatus", { mutate });

    render(
      <MemoryRouter initialEntries={["/app/tasks/t1"]}>
        <Routes>
          <Route path="/app/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Concluir Tarefa/ }));
    expect(mutate).toHaveBeenCalledWith({ id: "t1", status: "completed" });
  });
});
