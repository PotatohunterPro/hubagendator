import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.js";
import { BoardPage } from "./pages/Board.js";
import { DashboardPage } from "./pages/Dashboard.js";
import { LoginPage } from "./pages/Login.js";
import { NewTaskPage, TaskDetailPage, TasksPage } from "./pages/Tasks.js";
import { ClientDetailPage, ClientsPage, MorePage, NotificationsPage, SettingsPage, TeamPage } from "./pages/Secondary.js";
import { getUserId } from "./lib/session.js";

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getUserId() ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage scope="all" />} />
        <Route path="tasks/new" element={<NewTaskPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="my-tasks" element={<TasksPage scope="mine" />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="more" element={<MorePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
