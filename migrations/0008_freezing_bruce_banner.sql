CREATE INDEX "Card_deck_id_idx" ON "Card" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "Card_user_id_idx" ON "Card" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "Card_type_deck_id_idx" ON "Card" USING btree ("type","deck_id");--> statement-breakpoint
CREATE INDEX "Deck_user_id_idx" ON "Deck" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "DeckShare_shared_by_user_id_idx" ON "DeckShare" USING btree ("shared_by_user_id");