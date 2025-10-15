import { z } from 'zod';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Result } from '@/lib/utils';
import { cardSchema } from './card';

export type Deck = z.infer<typeof deckSchema>;
export const deckSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    userId: z.string(),
    cards: z.array(cardSchema),
    createdAt: z.date(),
  })
  .transform((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    user_id: d.userId,
    cards: d.cards,
    created_at: d.createdAt.toISOString(),
  }));

const decksSchema = z.array(deckSchema);

export async function getDecks(userId: string) {
  const decksWithCards = await db.query.deck.findMany({
    where: eq(deck.userId, userId),
    with: {
      cards: true,
    },
  });

  const res = decksSchema.safeParse(decksWithCards);
  return res;
}

export async function getDeckById(id: string): Promise<Result<Deck, Error>> {
  if (!id) {
    return {
      data: null,
      error: Error('Deck ID not found'),
    };
  }

  const deckWithCards = await db.query.deck.findFirst({
    where: eq(deck.id, id),
    with: {
      cards: true,
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
