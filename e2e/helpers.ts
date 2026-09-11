import { expect, type Page } from "@playwright/test";

export const DEFAULT_PASSWORD = "hubsolucao";

export function ymd(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function login(page: Page, name: string, password = DEFAULT_PASSWORD): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /Entrar na operação/ }).click();
  await expect(page).toHaveURL(/\/app/);
}

export async function logout(page: Page): Promise<void> {
  await page.goto("/app/settings");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** Cria uma tarefa; se `schedule` for informado, habilita o agendamento. */
export async function createTask(
  page: Page,
  opts: { title: string; assignee: string; start?: string; end?: string; date?: string; location?: string },
): Promise<void> {
  await page.goto("/app/tasks/new");
  await page.getByLabel("Título da Demanda").fill(opts.title);
  await page.getByRole("button", { name: new RegExp(opts.assignee) }).first().click();
  if (opts.start && opts.end) {
    await page.getByRole("button", { name: "Sim" }).click();
    await page.locator('input[type="date"]').fill(opts.date ?? ymd());
    const times = page.locator('input[type="time"]');
    await times.nth(0).fill(opts.start);
    await times.nth(1).fill(opts.end);
    if (opts.location) await page.getByPlaceholder("Ex.: Bairro Y").fill(opts.location);
  }
  await page.getByRole("button", { name: "Criar e Atribuir Tarefa" }).click();
  await expect(page.getByText("Demanda Encaminhada!").first()).toBeVisible();
}
