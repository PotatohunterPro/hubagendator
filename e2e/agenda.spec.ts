import { test, expect } from "@playwright/test";
import { createTask, login, ymd } from "./helpers";

test("formulário avisa conflito de horário do responsável", async ({ page }) => {
  await login(page, "Rodrigo");

  // Tarefa base 10:00–11:00 para Wellington.
  await createTask(page, {
    title: `E2E base ${Date.now()}`,
    assignee: "Wellington",
    start: "10:00",
    end: "11:00",
    date: ymd(),
  });

  // Nova tarefa sobreposta 10:30–11:30 → deve avisar conflito (sem bloquear).
  await page.goto("/app/tasks/new");
  await page.getByLabel("Título da Demanda").fill(`E2E conflito ${Date.now()}`);
  await page.getByRole("button", { name: /Wellington/ }).click();
  await page.getByRole("button", { name: "Sim" }).click();
  await page.locator('input[type="date"]').fill(ymd());
  const times = page.locator('input[type="time"]');
  await times.nth(0).fill("10:30");
  await times.nth(1).fill("11:30");

  await expect(page.getByText(/já possui outra atividade neste horário/)).toBeVisible();
});
