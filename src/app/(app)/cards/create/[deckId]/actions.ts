'use server';

import { BlackCardType, CardType, CardWithDeck } from '@/lib/api/card';
import { Deck } from '@/lib/api/deck';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';

type Props = {
  text: string;
  type: keyof typeof CardType;
  blackCardType?: keyof typeof BlackCardType;
  deck: Deck;
};

type Result = {
  success: boolean;
  error?: string;
  card?: CardWithDeck;
};

export async function createCard({
  text,
  type,
  blackCardType,
  deck,
}: Props): Promise<Result> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    const [newCard] = await db
      .insert(card)
      .values({
        text,
        type,
        blackCardType: type === 'black' ? blackCardType : null,
        deckId: deck.id,
        userId,
      })
      .returning();

    return {
      success: true,
      error: undefined,
      card: {
        id: newCard.id,
        type: newCard.type,
        black_card_type: newCard.blackCardType,
        text: newCard.text!,
        deck_id: newCard.deckId,
        created_at: newCard.createdAt.toISOString(),
        deck: {
          id: deck.id,
          name: deck.name,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      card: undefined,
    };
  }
}
