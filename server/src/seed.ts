// Seed de desenvolvimento — plano.md §16. Só dados fictícios. Idempotente.
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../.env", import.meta.url) });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { hashPassword } from "./auth/password.js";
import {
  clients,
  notifications,
  organizationMembers,
  organizations,
  taskComments,
  taskEvents,
  tasks,
  teamMembers,
  teams,
  users,
} from "../../drizzle/schema.js";

const ORG = "e0000000-0000-4000-8000-000000000001";
const TEAM = "e0000000-0000-4000-8000-000000000002";
// Senha padrão do ambiente de demonstração (login interno por nome + senha).
const DEMO_PASSWORD = "hubsolucao";
const today6pm = new Date(new Date().setHours(18, 0, 0, 0));
const tomorrow = new Date(Date.now() + 86400000);
const yesterday = new Date(Date.now() - 86400000);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente — copie .env.example para .env");
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  const pw = hashPassword(DEMO_PASSWORD);

  await db.insert(organizations).values({ id: ORG, name: "Empresa demo", timezone: "America/Sao_Paulo" }).onConflictDoNothing();

  // Rodrigo é o gestor inicial; os demais são colaboradores de demonstração.
  await db
    .insert(users)
    .values([
      { id: "rodrigo", name: "Rodrigo", email: "rodrigo@hubsolucao.com.br", passwordHash: pw },
      { id: "carlos", name: "Carlos", email: "carlos@demo.local", passwordHash: pw },
      { id: "gisele", name: "Gisele", email: "gisele@demo.local", passwordHash: pw },
      { id: "wellington", name: "Wellington", email: "wellington@demo.local", passwordHash: pw },
    ])
    .onConflictDoUpdate({ target: users.id, set: { passwordHash: sql`excluded.password_hash` } });

  await db.insert(organizationMembers).values([
    { organizationId: ORG, userId: "rodrigo", role: "manager" },
    { organizationId: ORG, userId: "carlos", role: "manager" },
    { organizationId: ORG, userId: "gisele", role: "member" },
    { organizationId: ORG, userId: "wellington", role: "member" },
  ]).onConflictDoNothing();

  await db.insert(teams).values({ id: TEAM, organizationId: ORG, name: "Operação" }).onConflictDoNothing();
  await db.insert(teamMembers).values([
    { teamId: TEAM, userId: "gisele" },
    { teamId: TEAM, userId: "wellington" },
  ]).onConflictDoNothing();

  const clientIds = [
    "aaaaaaaa-1111-4111-8111-111111111111",
    "bbbbbbbb-2222-4222-8222-222222222222",
    "cccccccc-3333-4333-8333-333333333333",
  ];
  await db.insert(clients).values([
    { id: clientIds[0], organizationId: ORG, name: "Cliente X", company: "Empresa X" },
    { id: clientIds[1], organizationId: ORG, name: "Cliente Y", company: "Empresa Y" },
    { id: clientIds[2], organizationId: ORG, name: "Cliente Z", company: "Empresa Z" },
  ]).onConflictDoNothing();

  const taskIds = [
    "d0000000-0000-4000-8000-000000000001",
    "d0000000-0000-4000-8000-000000000002",
    "d0000000-0000-4000-8000-000000000003",
    "d0000000-0000-4000-8000-000000000004",
  ];
  await db.insert(tasks).values([
    { id: taskIds[0], organizationId: ORG, title: "Mandar cobrança para o Cliente X", status: "in_progress", priority: "high", assigneeId: "gisele", creatorId: "carlos", teamId: TEAM, clientId: clientIds[0], dueAt: today6pm },
    { id: taskIds[1], organizationId: ORG, title: "Fazer venda porta a porta no Bairro Y", status: "todo", priority: "normal", assigneeId: "wellington", creatorId: "carlos", teamId: TEAM, clientId: clientIds[1], dueAt: tomorrow },
    { id: taskIds[2], organizationId: ORG, title: "Confirmar visita com o Cliente Z", status: "todo", priority: "urgent", assigneeId: "wellington", creatorId: "carlos", clientId: clientIds[2], dueAt: yesterday },
    { id: taskIds[3], organizationId: ORG, title: "Enviar comprovante da cobrança", status: "completed", priority: "normal", assigneeId: "gisele", creatorId: "carlos", completedAt: new Date(), completedBy: "gisele" },
  ]).onConflictDoNothing();

  await db.insert(taskEvents).values([
    { taskId: taskIds[0], actorId: "carlos", eventType: "created" },
    { taskId: taskIds[0], actorId: "carlos", eventType: "reassigned", metadata: { to: "gisele" } },
    { taskId: taskIds[0], actorId: "gisele", eventType: "status:todo->in_progress" },
    { taskId: taskIds[3], actorId: "gisele", eventType: "status:in_progress->completed" },
  ]).onConflictDoNothing();

  await db.insert(taskComments).values([
    { taskId: taskIds[0], authorId: "gisele", body: "Cliente pediu retorno às 14h" },
  ]).onConflictDoNothing();

  await db.insert(notifications).values([
    { organizationId: ORG, userId: "gisele", type: "task_assigned", taskId: taskIds[0], title: "Nova tarefa para você", body: "Carlos atribuiu “Mandar cobrança para o Cliente X”." },
    { organizationId: ORG, userId: "wellington", type: "task_assigned", taskId: taskIds[1], title: "Nova tarefa para você", body: "Carlos atribuiu “Fazer venda porta a porta no Bairro Y”." },
  ]).onConflictDoNothing();

  console.log("[seed] OK — org demo + 3 usuários + 3 clientes + 4 tarefas + eventos.");
  await pool.end();
}

main().catch((err) => { console.error("[seed] falhou:", err); process.exit(1); });
