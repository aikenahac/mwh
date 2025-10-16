'use server';

import { CardType } from '@/lib/api/card';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { canEditDeck } from '@/lib/auth/permissions';

type Result = {
  success: boolean;
  error?: string;
};

type DeleteProps = {
  id: string;
};

export async function deleteCard({ id }: DeleteProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Get the card to find its deck
    const cardData = await db.query.card.findFirst({
      where: eq(card.id, id),
    });

    if (!cardData) {
      return {
        success: false,
        error: 'Card not found',
      };
    }

    // Check if user can edit the deck (cards inherit deck permissions)
    const canEdit = await canEditDeck(cardData.deckId, userId);
    if (!canEdit) {
      return {
        success: false,
        error: 'You do not have permission to delete this card',
      };
    }

    await db.delete(card).where(eq(card.id, id));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

type UpdateProps = {
  id: string;
  text?: string;
  type?: keyof typeof CardType;
  pick?: number;
};

export async function updateCard({
  id,
  text,
  type,
  pick,
}: UpdateProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Validate pick value if provided
    if (pick !== undefined && (pick < 1 || pick > 10)) {
      return {
        success: false,
        error: 'Pick value must be between 1 and 10',
      };
    }

    // Get the card to find its deck
    const cardData = await db.query.card.findFirst({
      where: eq(card.id, id),
    });

    if (!cardData) {
      return {
        success: false,
        error: 'Card not found',
      };
    }

    // Check if user can edit the deck (cards inherit deck permissions)
    const canEdit = await canEditDeck(cardData.deckId, userId);
    if (!canEdit) {
      return {
        success: false,
        error: 'You do not have permission to update this card',
      };
    }

    await db
      .update(card)
      .set({
        text,
        type,
        pick,
      })
      .where(eq(card.id, id));

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
