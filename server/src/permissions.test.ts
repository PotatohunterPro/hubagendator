import { describe, expect, it } from "vitest";
import { canArchive, canManageTask, canReopen } from "./permissions.js";

describe("permissões (plano.md §10)", () => {
  it("só admin/manager arquiva", () => {
    expect(canArchive("admin")).toBe(true);
    expect(canArchive("manager")).toBe(true);
    expect(canArchive("member")).toBe(false);
    expect(canArchive("leader")).toBe(false);
  });

  it("colaborador gerencia a própria tarefa, não a dos outros", () => {
    expect(canManageTask("member", { isAssignee: true, isCreator: false })).toBe(true);
    expect(canManageTask("member", { isAssignee: false, isCreator: false })).toBe(false);
  });

  it("gestor/líder reabrem; membro não", () => {
    expect(canReopen("manager")).toBe(true);
    expect(canReopen("member")).toBe(false);
  });
});
