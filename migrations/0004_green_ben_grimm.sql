ALTER TABLE "Card" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Deck" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Card" ADD COLUMN "is_source_card" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Deck" ADD COLUMN "is_source_deck" boolean DEFAULT false NOT NULL;