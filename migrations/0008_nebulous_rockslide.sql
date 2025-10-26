CREATE TYPE "public"."game_status" AS ENUM('lobby', 'playing', 'ended', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."round_status" AS ENUM('playing', 'judging', 'completed');--> statement-breakpoint
CREATE TABLE "CompletedGame" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"winner_user_id" text,
	"completed_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"total_rounds_played" integer NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"was_abandoned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompletedGameDeck" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completed_game_id" uuid NOT NULL,
	"deck_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompletedGamePlayer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completed_game_id" uuid NOT NULL,
	"clerk_user_id" text,
	"nickname" text NOT NULL,
	"final_score" integer NOT NULL,
	"rounds_won" integer NOT NULL,
	"was_owner" boolean DEFAULT false NOT NULL,
	"placement" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompletedRound" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completed_game_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"black_card_id" uuid NOT NULL,
	"czar_user_id" text,
	"winner_user_id" text,
	"winning_submission" jsonb NOT NULL,
	"all_submissions" jsonb NOT NULL,
	"completed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "GameSession" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"status" "game_status" DEFAULT 'lobby' NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"settings" jsonb NOT NULL,
	"join_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "GameSession_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "GameSessionDeck" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"deck_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "GameSessionDeck_session_id_deck_id_unique" UNIQUE("session_id","deck_id")
);
--> statement-breakpoint
CREATE TABLE "Player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"clerk_user_id" text,
	"nickname" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"hand" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_card_czar" boolean DEFAULT false NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"is_connected" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlayerStatistic" (
	"user_id" text PRIMARY KEY NOT NULL,
	"total_games_played" integer DEFAULT 0 NOT NULL,
	"total_games_won" integer DEFAULT 0 NOT NULL,
	"total_rounds_won" integer DEFAULT 0 NOT NULL,
	"total_rounds_played" integer DEFAULT 0 NOT NULL,
	"win_rate" real DEFAULT 0 NOT NULL,
	"favorite_winning_cards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_played_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Round" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"black_card_id" uuid NOT NULL,
	"czar_player_id" uuid NOT NULL,
	"winner_player_id" uuid,
	"status" "round_status" DEFAULT 'playing' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "Submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"card_ids" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CompletedGameDeck" ADD CONSTRAINT "CompletedGameDeck_completed_game_id_CompletedGame_id_fk" FOREIGN KEY ("completed_game_id") REFERENCES "public"."CompletedGame"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompletedGameDeck" ADD CONSTRAINT "CompletedGameDeck_deck_id_Deck_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."Deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompletedGamePlayer" ADD CONSTRAINT "CompletedGamePlayer_completed_game_id_CompletedGame_id_fk" FOREIGN KEY ("completed_game_id") REFERENCES "public"."CompletedGame"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompletedRound" ADD CONSTRAINT "CompletedRound_completed_game_id_CompletedGame_id_fk" FOREIGN KEY ("completed_game_id") REFERENCES "public"."CompletedGame"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompletedRound" ADD CONSTRAINT "CompletedRound_black_card_id_Card_id_fk" FOREIGN KEY ("black_card_id") REFERENCES "public"."Card"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GameSessionDeck" ADD CONSTRAINT "GameSessionDeck_session_id_GameSession_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."GameSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GameSessionDeck" ADD CONSTRAINT "GameSessionDeck_deck_id_Deck_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."Deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Player" ADD CONSTRAINT "Player_session_id_GameSession_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."GameSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Round" ADD CONSTRAINT "Round_session_id_GameSession_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."GameSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Round" ADD CONSTRAINT "Round_black_card_id_Card_id_fk" FOREIGN KEY ("black_card_id") REFERENCES "public"."Card"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Round" ADD CONSTRAINT "Round_czar_player_id_Player_id_fk" FOREIGN KEY ("czar_player_id") REFERENCES "public"."Player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Round" ADD CONSTRAINT "Round_winner_player_id_Player_id_fk" FOREIGN KEY ("winner_player_id") REFERENCES "public"."Player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_round_id_Round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."Round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_player_id_Player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."Player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "CompletedGame_owner_id_idx" ON "CompletedGame" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "CompletedGame_winner_user_id_idx" ON "CompletedGame" USING btree ("winner_user_id");--> statement-breakpoint
CREATE INDEX "CompletedGame_completed_at_idx" ON "CompletedGame" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "CompletedGame_created_at_idx" ON "CompletedGame" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "CompletedGameDeck_completed_game_id_idx" ON "CompletedGameDeck" USING btree ("completed_game_id");--> statement-breakpoint
CREATE INDEX "CompletedGameDeck_deck_id_idx" ON "CompletedGameDeck" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "CompletedGamePlayer_completed_game_id_idx" ON "CompletedGamePlayer" USING btree ("completed_game_id");--> statement-breakpoint
CREATE INDEX "CompletedGamePlayer_clerk_user_id_idx" ON "CompletedGamePlayer" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "CompletedRound_completed_game_id_idx" ON "CompletedRound" USING btree ("completed_game_id");--> statement-breakpoint
CREATE INDEX "GameSession_owner_id_idx" ON "GameSession" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "GameSession_status_idx" ON "GameSession" USING btree ("status");--> statement-breakpoint
CREATE INDEX "GameSession_join_code_idx" ON "GameSession" USING btree ("join_code");--> statement-breakpoint
CREATE INDEX "GameSessionDeck_session_id_idx" ON "GameSessionDeck" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "GameSessionDeck_deck_id_idx" ON "GameSessionDeck" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "Player_session_id_idx" ON "Player" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "Player_clerk_user_id_idx" ON "Player" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "PlayerStatistic_win_rate_idx" ON "PlayerStatistic" USING btree ("win_rate");--> statement-breakpoint
CREATE INDEX "PlayerStatistic_total_games_won_idx" ON "PlayerStatistic" USING btree ("total_games_won");--> statement-breakpoint
CREATE INDEX "PlayerStatistic_last_played_at_idx" ON "PlayerStatistic" USING btree ("last_played_at");--> statement-breakpoint
CREATE INDEX "Round_session_id_idx" ON "Round" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "Round_status_idx" ON "Round" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Submission_round_id_idx" ON "Submission" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "Submission_player_id_idx" ON "Submission" USING btree ("player_id");