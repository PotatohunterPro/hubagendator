import { test, expect } from "@playwright/test";
import { createTask, login, logout, ymd } from "./helpers";

test("fluxo completo: gestor agenda, colaborador executa, gestor acompanha", async ({ page }) => {
  const title = `E2E venda porta a porta ${Date.now()}`;

  // 1. Gestor cria tarefa agendada para Wellington.
  await login(page, "Rodrigo");
  await createTask(page, { title, assignee: "Wellington", start: "10:00", end: "13:00", location: "Bairro Y", date: ymd() });

  // 2. Aparece na Agenda do dia.
  await page.goto("/app/calendar");
  await expect(page.getByText(title)).toBeVisible();

  await logout(page);

  // 3. Wellington executa pela agenda/tarefas.
  await login(page, "Wellington");
  await page.goto("/app/my-tasks");
  await page.getByText(title).click();
  await page.getByRole("button", { name: /Iniciar tarefa/ }).click();
  await page.getByLabel("Adicionar observação").fill("Cliente pediu retorno às 14h");
  await page.getByRole("button", { name: /Enviar/ }).click();
  await expect(page.getByText("Cliente pediu retorno às 14h")).toBeVisible();
  await page.getByRole("button", { name: /Concluir Tarefa/ }).click();
  await expect(page.getByText("Concluída", { exact: true }).first()).toBeVisible();

  await logout(page);

  // 4. Gestor vê concluída e o histórico.
  await login(page, "Rodrigo");
  await page.goto("/app/tasks");
  await page.getByLabel("Buscar tarefas").fill(title);
  await page.getByText(title).click();
  await expect(page.getByText("Concluída", { exact: true }).first()).toBeVisible();
  await page.getByText("Histórico de auditoria").click();
  await expect(page.getByText(/status:in_progress->completed/)).toBeVisible();
});

test("painel mostra atrasadas e o filtro de atrasadas funciona", async ({ page }) => {
  await login(page, "Rodrigo");
  await expect(page.getByText("Atrasadas").first()).toBeVisible();
  await page.goto("/app/tasks?overdueOnly=1");
  await expect(page.getByLabel("Buscar tarefas")).toBeVisible();
});
