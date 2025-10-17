import { z } from 'zod';
import { db } from '@/lib/db';
import { deck, deckShare } from '@/lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';
import { Result } from '@/lib/utils';
import { cardSchema } from './card';
import { canViewDeck } from '@/lib/auth/permissions';

const deckShareSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  sharedWithUserId: z.string(),
  sharedByUserId: z.string(),
  permission: z.enum(['view', 'collaborate']),
  createdAt: z.date(),
});

export type Deck = z.infer<typeof deckSchema>;
export const deckSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    userId: z.string(),
    cards: z.array(cardSchema),
    shares: z.array(deckShareSchema).optional().default([]),
    createdAt: z.date(),
  })
  .transform((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    user_id: d.userId,
    cards: d.cards,
    shares: d.shares,
    created_at: d.createdAt.toISOString(),
  }));

const decksSchema = z.array(deckSchema);

export async function getDecks(userId: string) {
  // Get deck IDs shared with the user
  const sharedDeckIds = await db
    .select({ deckId: deckShare.deckId })
    .from(deckShare)
    .where(eq(deckShare.sharedWithUserId, userId));

  const sharedIds = sharedDeckIds.map((s) => s.deckId);

  // Get all decks (owned by user or shared with user)
  const decksWithCards = await db.query.deck.findMany({
    where:
      sharedIds.length > 0
        ? or(eq(deck.userId, userId), inArray(deck.id, sharedIds))
        : eq(deck.userId, userId),
    with: {
      cards: true,
      shares: true,
    },
  });

  const res = decksSchema.safeParse(decksWithCards);
  return res;
}

export async function getDeckById(
  id: string,
  userId: string,
): Promise<Result<Deck, Error>> {
  if (!id) {
    return {
      data: null,
      error: Error('Deck ID not found'),
    };
  }

  // Check if user has permission to view this deck
  const hasAccess = await canViewDeck(id, userId);
  if (!hasAccess) {
    return {
      data: null,
      error: new Error('You do not have permission to view this deck'),
    };
  }

  const deckWithCards = await db.query.deck.findFirst({
    where: eq(deck.id, id),
    with: {
      cards: true,
      shares: true,
    },
  });

  if (!deckWithCards) {
    return {
      data: null,
      error: new Error('Deck not found'),
    };
  }

  const parsed = deckSchema.safeParse(deckWithCards);
  if (!parsed.success) {
    return {
      data: null,
      error: new Error('Deck not found'),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}
