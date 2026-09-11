import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("login rejeita senha incorreta", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Nome").fill("Rodrigo");
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: /Entrar na operação/ }).click();
  await expect(page.getByText(/Nome ou senha inválidos/)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("login válido leva ao painel", async ({ page }) => {
  await login(page, "Rodrigo");
  await expect(page.getByRole("heading", { name: "Precisa da sua atenção" })).toBeVisible();
});
