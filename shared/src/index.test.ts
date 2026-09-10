import { describe, expect, it } from "vitest";
import { canTransition, isOverdue } from "./index.js";

describe("isOverdue (plano.md §7)", () => {
  it("detecta atraso quando prazo passou e status aberto", () => {
    expect(
      isOverdue({ status: "todo", dueAt: "2020-01-01T00:00:00Z", now: new Date("2026-01-01T00:00:00Z") }),
    ).toBe(true);
  });

  it("nunca marca concluída/arquivada como atrasada", () => {
    const past = "2020-01-01T00:00:00Z";
    const now = new Date("2026-01-01T00:00:00Z");
    expect(isOverdue({ status: "completed", dueAt: past, now })).toBe(false);
    expect(isOverdue({ status: "archived", dueAt: past, now })).toBe(false);
  });

  it("sem prazo => nunca atrasada", () => {
    expect(isOverdue({ status: "todo", dueAt: null })).toBe(false);
  });
});

describe("canTransition (plano.md §7)", () => {
  it("permite todo -> in_progress -> completed", () => {
    expect(canTransition("todo", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
  });

  it("permite concluir 2x (idempotência)", () => {
    expect(canTransition("completed", "completed")).toBe(true);
  });

  it("bloqueia completed -> todo direto", () => {
    expect(canTransition("completed", "todo")).toBe(false);
  });
});
