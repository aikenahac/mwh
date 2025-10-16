import { pgTable, text, timestamp, pgEnum, uuid, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const cardTypeEnum = pgEnum('cardtype', ['white', 'black']);
export const blackCardTypeEnum = pgEnum('black_card_type', ['normal', 'pick_2']);
export const sharePermissionEnum = pgEnum('share_permission', ['view', 'collaborate']);

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

export const deckShare = pgTable('DeckShare', {
  id: uuid('id').defaultRandom().primaryKey(),
  deckId: uuid('deck_id').notNull().references(() => deck.id, { onDelete: 'cascade' }),
  sharedWithUserId: text('shared_with_user_id').notNull(),
  sharedByUserId: text('shared_by_user_id').notNull(),
  permission: sharePermissionEnum('permission').notNull().default('view'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueShare: unique().on(table.deckId, table.sharedWithUserId),
  deckIdIdx: index('DeckShare_deck_id_idx').on(table.deckId),
  sharedWithUserIdIdx: index('DeckShare_shared_with_user_id_idx').on(table.sharedWithUserId),
}));

// Relations
export const deckRelations = relations(deck, ({ many }) => ({
  cards: many(card),
  shares: many(deckShare),
}));

export const cardRelations = relations(card, ({ one }) => ({
  deck: one(deck, {
    fields: [card.deckId],
    references: [deck.id],
  }),
}));

export const deckShareRelations = relations(deckShare, ({ one }) => ({
  deck: one(deck, {
    fields: [deckShare.deckId],
    references: [deck.id],
  }),
}));

// Types
export type Deck = typeof deck.$inferSelect;
export type NewDeck = typeof deck.$inferInsert;
export type Card = typeof card.$inferSelect;
export type NewCard = typeof card.$inferInsert;
export type DeckShare = typeof deckShare.$inferSelect;
export type NewDeckShare = typeof deckShare.$inferInsert;
