CREATE TYPE "public"."task_status" AS ENUM('pending', 'in-progress', 'completed');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000),
	"status" "task_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
