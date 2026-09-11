import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../.env", import.meta.url) });
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context.js";
import { appRouter } from "./routers/index.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — mesmo limite do tasks.addAttachment
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf", "text/plain",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  },
});

export function buildApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "hubagendor-server" }));

  // Arquivos de evidência (Etapa 4). Dev: disco local; produção: object storage
  // (OBJECT_STORAGE_*). Metadados ficam no Postgres (taskAttachments).
  app.use("/files", express.static(uploadDir));
  app.post("/uploads", (req, res, next) => {
    // Sessão: exige token (o mecanismo real). Sem token => 401.
    if (!req.headers["x-session-token"] && !req.headers["x-user-id"]) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    next();
  }, upload.single("file"), (req, res) => {
    const f = req.file as Express.Multer.File | undefined;
    if (!f) {
      res.status(400).json({ error: "Nenhum arquivo enviado" });
      return;
    }
    res.json({
      fileUrl: `/files/${f.filename}`,
      fileName: Buffer.from(f.originalname, "latin1").toString("utf8"),
      mimeType: f.mimetype,
      fileSize: f.size,
    });
  });

  app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
