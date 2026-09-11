import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BoardPage } from "./Board.js";
import { resetTrpcMock, setMutation, setQuery } from "../test/trpcMock.js";

// plano2.0 §8/§39: Kanban — colunas, drag-and-drop desktop, mobile sem arrastar.
vi.mock("../lib/trpc.js", async () => {
  const mock = await import("../test/trpcMock.js");
  return { trpc: mock.trpc };
});

beforeEach(() => resetTrpcMock());

const base = { total: 2, page: 1, pageSize: 100 };
const items = [
  { id: "t1", title: "Mandar cobrança para o Cliente X", status: "todo", priority: "high", assigneeId: "gisele", dueAt: null, overdue: false },
  { id: "t2", title: "Enviar comprovante", status: "completed", priority: "normal", assigneeId: "gisele", dueAt: null, overdue: false },
];

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={["/app/board"]}>
      <BoardPage />
    </MemoryRouter>,
  );
}

describe("BoardPage — colunas", () => {
  it("renderiza as 3 colunas com os cards agrupados", () => {
    setQuery("tasks.list", { data: { ...base, items } });
    renderBoard();
    expect(screen.getByTestId("column-todo")).toBeTruthy();
    expect(screen.getByTestId("column-in_progress")).toBeTruthy();
    expect(screen.getByTestId("column-completed")).toBeTruthy();
    expect(screen.getByText("Mandar cobrança para o Cliente X")).toBeTruthy();
    expect(screen.getByText("Enviar comprovante")).toBeTruthy();
  });
});

describe("BoardPage — estados", () => {
  it("mostra loading enquanto carrega", () => {
    setQuery("tasks.list", { isPending: true });
    renderBoard();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("mostra erro acionável", () => {
    setQuery("tasks.list", { isError: true });
    renderBoard();
    expect(screen.getByText(/Não foi possível carregar o quadro/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tentar de novo/ })).toBeTruthy();
  });
});

describe("BoardPage — drag and drop (desktop)", () => {
  it("mover um card para Concluídas chama setStatus(completed)", () => {
    setQuery("tasks.list", { data: { ...base, items } });
    const mutate = vi.fn();
    setMutation("tasks.setStatus", { mutate });
    renderBoard();

    const card = screen.getByTestId("card-t1");
    const column = screen.getByTestId("column-completed");
    fireEvent.dragStart(card);
    fireEvent.drop(column);

    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ id: "t1", status: "completed" }));
  });
});

describe("BoardPage — mobile", () => {
  it("orienta usar lista e ações rápidas no celular (sem drag)", () => {
    setQuery("tasks.list", { data: { ...base, items } });
    renderBoard();
    expect(screen.getByText(/No celular use a lista de tarefas/)).toBeTruthy();
  });
});
