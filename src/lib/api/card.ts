import { z } from 'zod';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Deck } from './deck';

export const CardType = {
  white: 'white',
  black: 'black',
} as const;

export const BlackCardType = {
  normal: 'normal',
  pick_2: 'pick_2',
} as const;

export type Card = z.infer<typeof cardSchema>;
export const cardSchema = z
  .object({
    id: z.string(),
    type: z.enum(['white', 'black']),
    blackCardType: z.enum(['normal', 'pick_2']).optional().nullish(),
    text: z.string().nullish(),
    deckId: z.string(),
    userId: z.string(),
    createdAt: z.date(),
  })
  .transform((c) => ({
    id: c.id,
    type: c.type,
    black_card_type: c.blackCardType,
    text: c.text,
    deck_id: c.deckId,
    created_at: c.createdAt.toISOString(),
  }));

export const cardsSchema = z.array(cardSchema);

export type CardWithDeck = Card & {
  deck: Pick<Deck, 'id' | 'name'>;
};

export async function getCardById(cardId: string) {
  const cardData = await db.query.card.findFirst({
    where: eq(card.id, cardId),
  });

  if (!cardData) {
    return { success: false, data: null };
  }

  return cardSchema.safeParse(cardData);
}
