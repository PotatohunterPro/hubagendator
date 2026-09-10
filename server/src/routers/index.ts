import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { clientsRouter } from "./clients.js";
import { notificationsRouter } from "./notifications.js";
import { organizationRouter } from "./organization.js";
import { tasksRouter } from "./tasks.js";
import { teamsRouter } from "./teams.js";

export const appRouter = router({
  auth: authRouter,
  organization: organizationRouter,
  teams: teamsRouter,
  clients: clientsRouter,
  tasks: tasksRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
