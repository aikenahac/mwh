import { pgTable, text, timestamp, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const cardTypeEnum = pgEnum('cardtype', ['white', 'black']);
export const blackCardTypeEnum = pgEnum('black_card_type', ['normal', 'pick_2']);

// Tables
export const deck = pgTable('Deck', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const card = pgTable('Card', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: cardTypeEnum('type').notNull().default('white'),
  text: text('text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deckId: uuid('deck_id').notNull().references(() => deck.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  blackCardType: blackCardTypeEnum('black_card_type'),
});

// Relations
export const deckRelations = relations(deck, ({ many }) => ({
  cards: many(card),
}));

export const cardRelations = relations(card, ({ one }) => ({
  deck: one(deck, {
    fields: [card.deckId],
    references: [deck.id],
  }),
}));

// Types
export type Deck = typeof deck.$inferSelect;
export type NewDeck = typeof deck.$inferInsert;
export type Card = typeof card.$inferSelect;
export type NewCard = typeof card.$inferInsert;
