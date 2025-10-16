ALTER TABLE "Card" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Deck" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Card" ADD COLUMN "pick" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "Card" DROP COLUMN "is_source_card";--> statement-breakpoint
ALTER TABLE "Card" DROP COLUMN "black_card_type";--> statement-breakpoint
ALTER TABLE "Deck" DROP COLUMN "is_source_deck";--> statement-breakpoint
DROP TYPE "public"."black_card_type";