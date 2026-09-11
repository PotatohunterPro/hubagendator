import "dotenv/config";
import { buildApp } from "./app.js";
import { startNotificationScheduler } from "./jobs/dueNotifications.js";

const port = Number(process.env.PORT ?? 3333);
buildApp().listen(port, () => {
  console.log(`[server] tRPC em http://localhost:${port}/trpc — health em /health`);
  startNotificationScheduler();
});
