CREATE TYPE "public"."share_permission" AS ENUM('view', 'collaborate');--> statement-breakpoint
CREATE TABLE "DeckShare" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"shared_by_user_id" text NOT NULL,
	"permission" "share_permission" DEFAULT 'view' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DeckShare" ADD CONSTRAINT "DeckShare_deck_id_Deck_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."Deck"("id") ON DELETE cascade ON UPDATE no action;