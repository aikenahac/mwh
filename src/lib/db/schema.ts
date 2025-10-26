import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  unique,
  index,
  integer,
  boolean,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const cardTypeEnum = pgEnum('cardtype', ['white', 'black']);
export const sharePermissionEnum = pgEnum('share_permission', [
  'view',
  'collaborate',
]);
export const userRoleEnum = pgEnum('user_role', ['superadmin']);
export const gameStatusEnum = pgEnum('game_status', [
  'lobby',
  'playing',
  'ended',
  'abandoned',
]);
export const roundStatusEnum = pgEnum('round_status', [
  'playing',
  'judging',
  'completed',
]);

// Tables
export const deck = pgTable('Deck', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const card = pgTable('Card', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: cardTypeEnum('type').notNull().default('white'),
  text: text('text'),
  pick: integer('pick').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  deckId: uuid('deck_id')
    .notNull()
    .references(() => deck.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
});

export const deckShare = pgTable(
  'DeckShare',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => deck.id, { onDelete: 'cascade' }),
    sharedWithUserId: text('shared_with_user_id').notNull(),
    sharedByUserId: text('shared_by_user_id').notNull(),
    permission: sharePermissionEnum('permission').notNull().default('view'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueShare: unique().on(table.deckId, table.sharedWithUserId),
    deckIdIdx: index('DeckShare_deck_id_idx').on(table.deckId),
    sharedWithUserIdIdx: index('DeckShare_shared_with_user_id_idx').on(
      table.sharedWithUserId,
    ),
  }),
);

export const userRole = pgTable('UserRole', {
  userId: text('user_id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================
// ACTIVE GAME TABLES
// ============================================

/**
 * Game Sessions - Tracks active game lobbies and games
 * When a game ends, data is archived to completed_games and this record is deleted
 */
export const gameSession = pgTable(
  'GameSession',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id').notNull(), // Clerk user ID of the player who created the game
    status: gameStatusEnum('status').notNull().default('lobby'),
    currentRound: integer('current_round').notNull().default(0),
    // Settings stored as JSONB: { pointsToWin: number, handSize: number, hasTimer: boolean, timerSeconds?: number }
    settings: jsonb('settings')
      .notNull()
      .$type<{
        pointsToWin: number;
        handSize: number;
        hasTimer: boolean;
        timerSeconds?: number;
      }>(),
    // Join code for easy game access (e.g., "ABCD1234")
    joinCode: text('join_code').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ownerIdIdx: index('GameSession_owner_id_idx').on(table.ownerId),
    statusIdx: index('GameSession_status_idx').on(table.status),
    joinCodeIdx: index('GameSession_join_code_idx').on(table.joinCode),
  }),
);

/**
 * Game Session Decks - Junction table tracking which decks are active in a game
 * Managed by the game owner during lobby phase, locked when game starts
 */
export const gameSessionDeck = pgTable(
  'GameSessionDeck',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => deck.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueSessionDeck: unique().on(table.sessionId, table.deckId),
    sessionIdIdx: index('GameSessionDeck_session_id_idx').on(table.sessionId),
    deckIdIdx: index('GameSessionDeck_deck_id_idx').on(table.deckId),
  }),
);

/**
 * Players - Tracks all players in a game session
 * Contains their hand, score, and role information
 */
export const player = pgTable(
  'Player',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    clerkUserId: text('clerk_user_id'), // Null for guest players
    nickname: text('nickname').notNull(),
    score: integer('score').notNull().default(0),
    // Hand stored as array of card IDs
    hand: jsonb('hand').notNull().default([]).$type<string[]>(),
    isCardCzar: boolean('is_card_czar').notNull().default(false),
    isOwner: boolean('is_owner').notNull().default(false),
    isConnected: boolean('is_connected').notNull().default(true),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdIdx: index('Player_session_id_idx').on(table.sessionId),
    clerkUserIdIdx: index('Player_clerk_user_id_idx').on(table.clerkUserId),
  }),
);

/**
 * Rounds - Individual rounds of gameplay
 * Tracks the black card, czar, winner, and round state
 */
export const round = pgTable(
  'Round',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    blackCardId: uuid('black_card_id')
      .notNull()
      .references(() => card.id),
    czarPlayerId: uuid('czar_player_id')
      .notNull()
      .references(() => player.id),
    winnerPlayerId: uuid('winner_player_id').references(() => player.id),
    status: roundStatusEnum('status').notNull().default('playing'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    sessionIdIdx: index('Round_session_id_idx').on(table.sessionId),
    statusIdx: index('Round_status_idx').on(table.status),
  }),
);

/**
 * Submissions - Card submissions for each round
 * Players submit white cards anonymously, czar sees shuffled submissions
 */
export const submission = pgTable(
  'Submission',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => round.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => player.id, { onDelete: 'cascade' }),
    // Array of card IDs submitted (1 for normal cards, 2+ for "pick 2" prompts)
    cardIds: jsonb('card_ids').notNull().$type<string[]>(),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    roundIdIdx: index('Submission_round_id_idx').on(table.roundId),
    playerIdIdx: index('Submission_player_id_idx').on(table.playerId),
    // Ensure one submission per player per round
    uniqueSubmission: unique('Submission_round_player_unique').on(
      table.roundId,
      table.playerId,
    ),
  }),
);

// ============================================
// GAME HISTORY TABLES
// ============================================

/**
 * Completed Games - Archived finished games
 * Stores final game state and statistics for historical tracking
 */
export const completedGame = pgTable(
  'CompletedGame',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').notNull(), // Reference to original game session (not FK, data deleted)
    ownerId: text('owner_id').notNull(), // Clerk user ID
    winnerUserId: text('winner_user_id'), // Clerk user ID, null if winner was guest
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    totalRoundsPlayed: integer('total_rounds_played').notNull(),
    settings: jsonb('settings')
      .notNull()
      .$type<{
        pointsToWin: number;
        handSize: number;
        hasTimer: boolean;
        timerSeconds?: number;
      }>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(), // When game started
    wasAbandoned: boolean('was_abandoned').notNull().default(false),
  },
  (table) => ({
    ownerIdIdx: index('CompletedGame_owner_id_idx').on(table.ownerId),
    winnerUserIdIdx: index('CompletedGame_winner_user_id_idx').on(
      table.winnerUserId,
    ),
    completedAtIdx: index('CompletedGame_completed_at_idx').on(
      table.completedAt,
    ),
    createdAtIdx: index('CompletedGame_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Completed Game Decks - Junction table for historical deck usage
 * Tracks which decks were used in completed games
 */
export const completedGameDeck = pgTable(
  'CompletedGameDeck',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    completedGameId: uuid('completed_game_id')
      .notNull()
      .references(() => completedGame.id, { onDelete: 'cascade' }),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => deck.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    completedGameIdIdx: index('CompletedGameDeck_completed_game_id_idx').on(
      table.completedGameId,
    ),
    deckIdIdx: index('CompletedGameDeck_deck_id_idx').on(table.deckId),
  }),
);

/**
 * Completed Game Players - Historical player records
 * Stores final scores and placements for each player in completed games
 */
export const completedGamePlayer = pgTable(
  'CompletedGamePlayer',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    completedGameId: uuid('completed_game_id')
      .notNull()
      .references(() => completedGame.id, { onDelete: 'cascade' }),
    clerkUserId: text('clerk_user_id'), // Null for guest players
    nickname: text('nickname').notNull(),
    finalScore: integer('final_score').notNull(),
    roundsWon: integer('rounds_won').notNull(),
    wasOwner: boolean('was_owner').notNull().default(false),
    placement: integer('placement').notNull(), // 1st, 2nd, 3rd, etc.
  },
  (table) => ({
    completedGameIdIdx: index('CompletedGamePlayer_completed_game_id_idx').on(
      table.completedGameId,
    ),
    clerkUserIdIdx: index('CompletedGamePlayer_clerk_user_id_idx').on(
      table.clerkUserId,
    ),
  }),
);

/**
 * Completed Rounds - Archive of each round in completed games
 * Stores round-by-round history for game replay and analysis
 */
export const completedRound = pgTable(
  'CompletedRound',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    completedGameId: uuid('completed_game_id')
      .notNull()
      .references(() => completedGame.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    blackCardId: uuid('black_card_id')
      .notNull()
      .references(() => card.id),
    czarUserId: text('czar_user_id'), // Null for guest czars
    winnerUserId: text('winner_user_id'), // Null for guest winners
    // Winning submission as array of card IDs
    winningSubmission: jsonb('winning_submission').notNull().$type<string[]>(),
    // All submissions: [{ playerId: string, nickname: string, cardIds: string[] }]
    allSubmissions: jsonb('all_submissions')
      .notNull()
      .$type<
        Array<{ playerId: string; nickname: string; cardIds: string[] }>
      >(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    completedGameIdIdx: index('CompletedRound_completed_game_id_idx').on(
      table.completedGameId,
    ),
  }),
);

/**
 * Player Statistics - Aggregate statistics per user
 * Automatically updated when games are archived
 */
export const playerStatistic = pgTable(
  'PlayerStatistic',
  {
    userId: text('user_id').primaryKey(), // Clerk user ID
    totalGamesPlayed: integer('total_games_played').notNull().default(0),
    totalGamesWon: integer('total_games_won').notNull().default(0),
    totalRoundsWon: integer('total_rounds_won').notNull().default(0),
    totalRoundsPlayed: integer('total_rounds_played').notNull().default(0),
    winRate: real('win_rate').notNull().default(0), // Calculated as totalGamesWon / totalGamesPlayed
    // Array of card IDs that won most often: [{ cardId: string, winCount: number }]
    favoriteWinningCards: jsonb('favorite_winning_cards')
      .notNull()
      .default([])
      .$type<Array<{ cardId: string; winCount: number }>>(),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    winRateIdx: index('PlayerStatistic_win_rate_idx').on(table.winRate),
    totalGamesWonIdx: index('PlayerStatistic_total_games_won_idx').on(
      table.totalGamesWon,
    ),
    lastPlayedAtIdx: index('PlayerStatistic_last_played_at_idx').on(
      table.lastPlayedAt,
    ),
  }),
);

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

// Game session relations
export const gameSessionRelations = relations(gameSession, ({ many }) => ({
  players: many(player),
  decks: many(gameSessionDeck),
  rounds: many(round),
}));

export const gameSessionDeckRelations = relations(
  gameSessionDeck,
  ({ one }) => ({
    session: one(gameSession, {
      fields: [gameSessionDeck.sessionId],
      references: [gameSession.id],
    }),
    deck: one(deck, {
      fields: [gameSessionDeck.deckId],
      references: [deck.id],
    }),
  }),
);

export const playerRelations = relations(player, ({ one, many }) => ({
  session: one(gameSession, {
    fields: [player.sessionId],
    references: [gameSession.id],
  }),
  submissions: many(submission),
}));

export const roundRelations = relations(round, ({ one, many }) => ({
  session: one(gameSession, {
    fields: [round.sessionId],
    references: [gameSession.id],
  }),
  blackCard: one(card, {
    fields: [round.blackCardId],
    references: [card.id],
  }),
  czar: one(player, {
    fields: [round.czarPlayerId],
    references: [player.id],
  }),
  winner: one(player, {
    fields: [round.winnerPlayerId],
    references: [player.id],
  }),
  submissions: many(submission),
}));

export const submissionRelations = relations(submission, ({ one }) => ({
  round: one(round, {
    fields: [submission.roundId],
    references: [round.id],
  }),
  player: one(player, {
    fields: [submission.playerId],
    references: [player.id],
  }),
}));

// Completed game relations
export const completedGameRelations = relations(completedGame, ({ many }) => ({
  players: many(completedGamePlayer),
  decks: many(completedGameDeck),
  rounds: many(completedRound),
}));

export const completedGameDeckRelations = relations(
  completedGameDeck,
  ({ one }) => ({
    completedGame: one(completedGame, {
      fields: [completedGameDeck.completedGameId],
      references: [completedGame.id],
    }),
    deck: one(deck, {
      fields: [completedGameDeck.deckId],
      references: [deck.id],
    }),
  }),
);

export const completedGamePlayerRelations = relations(
  completedGamePlayer,
  ({ one }) => ({
    completedGame: one(completedGame, {
      fields: [completedGamePlayer.completedGameId],
      references: [completedGame.id],
    }),
  }),
);

export const completedRoundRelations = relations(completedRound, ({ one }) => ({
  completedGame: one(completedGame, {
    fields: [completedRound.completedGameId],
    references: [completedGame.id],
  }),
  blackCard: one(card, {
    fields: [completedRound.blackCardId],
    references: [card.id],
  }),
}));

// Types - Existing
export type Deck = typeof deck.$inferSelect;
export type NewDeck = typeof deck.$inferInsert;
export type Card = typeof card.$inferSelect;
export type NewCard = typeof card.$inferInsert;
export type DeckShare = typeof deckShare.$inferSelect;
export type NewDeckShare = typeof deckShare.$inferInsert;
export type UserRole = typeof userRole.$inferSelect;
export type NewUserRole = typeof userRole.$inferInsert;

// Types - Active Game Tables
export type GameSession = typeof gameSession.$inferSelect;
export type NewGameSession = typeof gameSession.$inferInsert;
export type GameSessionDeck = typeof gameSessionDeck.$inferSelect;
export type NewGameSessionDeck = typeof gameSessionDeck.$inferInsert;
export type Player = typeof player.$inferSelect;
export type NewPlayer = typeof player.$inferInsert;
export type Round = typeof round.$inferSelect;
export type NewRound = typeof round.$inferInsert;
export type Submission = typeof submission.$inferSelect;
export type NewSubmission = typeof submission.$inferInsert;

// Types - Game History Tables
export type CompletedGame = typeof completedGame.$inferSelect;
export type NewCompletedGame = typeof completedGame.$inferInsert;
export type CompletedGameDeck = typeof completedGameDeck.$inferSelect;
export type NewCompletedGameDeck = typeof completedGameDeck.$inferInsert;
export type CompletedGamePlayer = typeof completedGamePlayer.$inferSelect;
export type NewCompletedGamePlayer = typeof completedGamePlayer.$inferInsert;
export type CompletedRound = typeof completedRound.$inferSelect;
export type NewCompletedRound = typeof completedRound.$inferInsert;
export type PlayerStatistic = typeof playerStatistic.$inferSelect;
export type NewPlayerStatistic = typeof playerStatistic.$inferInsert;
