import { defineConfig, devices } from "@playwright/test";

// E2E contra o ambiente de desenvolvimento (Postgres + server + client).
// Os servidores já rodando são reaproveitados.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "npm run dev:server", url: "http://localhost:3333/health", reuseExistingServer: true, timeout: 60_000 },
    { command: "npm run dev:client", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000 },
  ],
});
