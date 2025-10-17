/**
 * Deck Service
 *
 * Handles deck retrieval and card pool management for games.
 * - Fetches system decks (userId = "system")
 * - Fetches user's owned decks
 * - Fetches decks shared with user
 * - Aggregates card pools from multiple decks
 */

import { db } from '@/lib/db';
import { deck, card, deckShare } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import type { DeckInfo, DeckWithCards, SelectedDecksInfo } from './types';
import type { Card } from '@/lib/db/schema';

/**
 * Get all decks available to a user (system decks + owned + shared)
 */
export async function getAvailableDecksForUser(userId: string): Promise<{
  systemDecks: DeckInfo[];
  userDecks: DeckInfo[];
}> {
  // Fetch system decks (userId = "system")
  const systemDecksData = await db.query.deck.findMany({
    where: eq(deck.userId, 'system'),
    with: {
      cards: true,
    },
  });

  // Fetch user's owned decks
  const ownedDecksData = await db.query.deck.findMany({
    where: eq(deck.userId, userId),
    with: {
      cards: true,
    },
  });

  // Fetch decks shared with user
  const sharedDecksData = await db
    .select({
      deck: deck,
      cards: card,
      sharedBy: deckShare.sharedByUserId,
    })
    .from(deckShare)
    .innerJoin(deck, eq(deckShare.deckId, deck.id))
    .leftJoin(card, eq(card.deckId, deck.id))
    .where(eq(deckShare.sharedWithUserId, userId));

  // Group shared decks by deck ID
  const sharedDecksMap = new Map<string, { deck: typeof deck.$inferSelect; cards: (typeof card.$inferSelect)[]; sharedBy: string }>();
  for (const row of sharedDecksData) {
    if (!sharedDecksMap.has(row.deck.id)) {
      sharedDecksMap.set(row.deck.id, {
        deck: row.deck,
        cards: [],
        sharedBy: row.sharedBy,
      });
    }
    if (row.cards) {
      sharedDecksMap.get(row.deck.id)!.cards.push(row.cards);
    }
  }

  // Convert to DeckInfo format
  const systemDecks = systemDecksData.map(d => toDeckInfo(d, true));
  const userDecks = [
    ...ownedDecksData.map(d => toDeckInfo(d, false)),
    ...Array.from(sharedDecksMap.values()).map(({ deck: d, cards: c, sharedBy }) =>
      toDeckInfo({ ...d, cards: c }, false, sharedBy),
    ),
  ];

  return { systemDecks, userDecks };
}

/**
 * Get specific decks by IDs with full card data
 */
export async function getDecksByIds(deckIds: string[]): Promise<DeckWithCards[]> {
  if (deckIds.length === 0) return [];

  const decksData = await db.query.deck.findMany({
    where: inArray(deck.id, deckIds),
    with: {
      cards: true,
    },
  });

  return decksData;
}

/**
 * Validate that decks exist and are accessible by user
 * Returns array of valid deck IDs
 */
export async function validateDeckAccess(deckIds: string[], userId: string): Promise<string[]> {
  if (deckIds.length === 0) return [];

  const decksData = await db
    .select({ id: deck.id, userId: deck.userId })
    .from(deck)
    .where(inArray(deck.id, deckIds));

  const deckUserIds = new Map(decksData.map(d => [d.id, d.userId]));

  // Get shared decks
  const sharedDeckIds = await db
    .select({ deckId: deckShare.deckId })
    .from(deckShare)
    .where(
      and(
        inArray(deckShare.deckId, deckIds),
        eq(deckShare.sharedWithUserId, userId),
      ),
    );

  const sharedIds = new Set(sharedDeckIds.map(s => s.deckId));

  // Filter valid deck IDs (system, owned, or shared with user)
  const validDeckIds = deckIds.filter(deckId => {
    const deckUserId = deckUserIds.get(deckId);
    if (!deckUserId) return false;
    return deckUserId === 'system' || deckUserId === userId || sharedIds.has(deckId);
  });

  return validDeckIds;
}

/**
 * Get selected decks info (counts, names, etc.)
 */
export async function getSelectedDecksInfo(deckIds: string[]): Promise<SelectedDecksInfo> {
  if (deckIds.length === 0) {
    return {
      decks: [],
      totalBlackCards: 0,
      totalWhiteCards: 0,
    };
  }

  const decksData = await db.query.deck.findMany({
    where: inArray(deck.id, deckIds),
    with: {
      cards: true,
    },
  });

  const decks: DeckInfo[] = decksData.map(d => {
    const blackCardCount = d.cards.filter(c => c.type === 'black').length;
    const whiteCardCount = d.cards.filter(c => c.type === 'white').length;
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      userId: d.userId,
      isSystem: d.userId === 'system',
      blackCardCount,
      whiteCardCount,
    };
  });

  const totalBlackCards = decks.reduce((sum, d) => sum + d.blackCardCount, 0);
  const totalWhiteCards = decks.reduce((sum, d) => sum + d.whiteCardCount, 0);

  return {
    decks,
    totalBlackCards,
    totalWhiteCards,
  };
}

/**
 * Aggregate card pool from selected decks
 * Returns shuffled arrays of black and white cards
 */
export async function aggregateCardPool(deckIds: string[]): Promise<{
  blackCards: Card[];
  whiteCards: Card[];
}> {
  const decksData = await getDecksByIds(deckIds);

  // Flatten all cards from all decks
  const allCards = decksData.flatMap(d => d.cards);

  // Separate by type
  const blackCards = allCards.filter(c => c.type === 'black');
  const whiteCards = allCards.filter(c => c.type === 'white');

  // Remove duplicates (same card ID)
  const uniqueBlackCards = Array.from(
    new Map(blackCards.map(c => [c.id, c])).values(),
  );
  const uniqueWhiteCards = Array.from(
    new Map(whiteCards.map(c => [c.id, c])).values(),
  );

  // Shuffle both arrays
  shuffleArray(uniqueBlackCards);
  shuffleArray(uniqueWhiteCards);

  return {
    blackCards: uniqueBlackCards,
    whiteCards: uniqueWhiteCards,
  };
}

/**
 * Validate that selected decks have enough cards to play
 */
export async function validateCardPool(
  deckIds: string[],
  playerCount: number,
  handSize: number,
): Promise<{ valid: boolean; error?: string }> {
  const { blackCards, whiteCards } = await aggregateCardPool(deckIds);

  const minBlackCards = 10; // At least 10 rounds worth
  const minWhiteCards = playerCount * handSize + 10; // Enough for all hands + buffer

  if (blackCards.length < minBlackCards) {
    return {
      valid: false,
      error: `Not enough black cards. Need at least ${minBlackCards}, but only have ${blackCards.length}.`,
    };
  }

  if (whiteCards.length < minWhiteCards) {
    return {
      valid: false,
      error: `Not enough white cards. Need at least ${minWhiteCards} for ${playerCount} players, but only have ${whiteCards.length}.`,
    };
  }

  return { valid: true };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert deck with cards to DeckInfo format
 */
function toDeckInfo(
  deckData: { id: string; name: string; description: string | null; userId: string; cards: Card[] },
  isSystem: boolean,
  sharedBy?: string,
): DeckInfo {
  const blackCardCount = deckData.cards.filter(c => c.type === 'black').length;
  const whiteCardCount = deckData.cards.filter(c => c.type === 'white').length;

  return {
    id: deckData.id,
    name: deckData.name,
    description: deckData.description,
    userId: deckData.userId,
    isSystem,
    blackCardCount,
    whiteCardCount,
    sharedBy,
  };
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
