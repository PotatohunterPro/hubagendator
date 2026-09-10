// Conexão Postgres via Drizzle. No esqueleto, o servidor SOBE mesmo sem banco
// (routers usam store em memória até a Etapa 2 ligar o Drizzle de verdade).
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../.env", import.meta.url) });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../drizzle/schema.js";

let pool: Pool | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[db] DATABASE_URL ausente — rodando sem Postgres (store em memória).");
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
    pool.on("error", (err) => console.error("[db] pool error", err));
  }
  return drizzle(pool, { schema });
}

export type Db = NonNullable<ReturnType<typeof getDb>>;
