CREATE TYPE "public"."black_card_type" AS ENUM('normal', 'pick_2');--> statement-breakpoint
CREATE TYPE "public"."cardtype" AS ENUM('white', 'black');--> statement-breakpoint
CREATE TABLE "Card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "cardtype" DEFAULT 'white' NOT NULL,
	"text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deck_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"black_card_type" "black_card_type"
);
--> statement-breakpoint
CREATE TABLE "Deck" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Card" ADD CONSTRAINT "Card_deck_id_Deck_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."Deck"("id") ON DELETE cascade ON UPDATE no action;