CREATE TYPE "public"."task_origin" AS ENUM('gestor', 'rotina', 'cliente', 'comercial', 'interna');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "origin" "task_origin";