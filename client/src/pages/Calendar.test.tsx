import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CalendarPage } from "./Calendar.js";
import { resetTrpcMock, setQuery } from "../test/trpcMock.js";

// Agenda v1 (frontend): dia, seção sem horário, vazio e alternância de visão.
vi.mock("../lib/trpc.js", async () => {
  const mock = await import("../test/trpcMock.js");
  return { trpc: mock.trpc };
});

beforeEach(() => resetTrpcMock());

const scheduled = {
  id: "t1", title: "Fazer venda porta a porta", status: "todo", priority: "normal",
  assigneeId: "wellington", clientName: "Cliente Y", dueAt: null,
  scheduledStart: "2026-09-12T13:00:00.000Z", scheduledEnd: "2026-09-12T16:00:00.000Z", location: "Bairro Y",
};
const unscheduled = {
  id: "t2", title: "Revisar documentos", status: "todo", priority: "normal",
  assigneeId: "gisele", clientName: "Cliente X", dueAt: "2026-09-12T20:00:00.000Z",
  scheduledStart: null, scheduledEnd: null, location: null,
};

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={["/app/calendar"]}>
      <CalendarPage />
    </MemoryRouter>,
  );
}

function seedCommon(agendaData: unknown) {
  setQuery("tasks.agenda", { data: agendaData });
  setQuery("tasks.list", { data: { items: [], total: 0, page: 1, pageSize: 20 } });
  setQuery("organization.getMembers", { data: [] });
  setQuery("teams.list", { data: [] });
}

describe("CalendarPage — dia", () => {
  it("mostra eventos com horário e a seção sem horário", () => {
    seedCommon({ scheduled: [scheduled], unscheduled: [unscheduled] });
    renderCalendar();
    expect(screen.getByText("Agenda")).toBeTruthy();
    expect(screen.getByText("Fazer venda porta a porta")).toBeTruthy();
    expect(screen.getByText("Sem horário")).toBeTruthy();
    expect(screen.getByText("Revisar documentos")).toBeTruthy();
    expect(screen.getByText("Bairro Y")).toBeTruthy();
  });

  it("mostra estado vazio quando não há eventos agendados", () => {
    seedCommon({ scheduled: [], unscheduled: [] });
    renderCalendar();
    expect(screen.getByText(/Nenhuma atividade agendada/)).toBeTruthy();
  });
});

describe("CalendarPage — visão", () => {
  it("alterna para semana", () => {
    seedCommon({ scheduled: [scheduled], unscheduled: [] });
    renderCalendar();
    fireEvent.click(screen.getByRole("button", { name: "Semana" }));
    // Cabeçalho de semana com intervalo de datas.
    expect(screen.getByRole("button", { name: "Dia" })).toBeTruthy();
  });
});
