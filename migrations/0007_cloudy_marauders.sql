CREATE TYPE "public"."user_role" AS ENUM('superadmin');--> statement-breakpoint
CREATE TABLE "UserRole" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
