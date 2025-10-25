import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { z } from 'zod';
import { canEditDeck } from '@/lib/auth/permissions';
import {
  successResponse,
  ErrorResponses,
  zodErrorResponse,
} from '@/lib/api-response';

const createCardSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['white', 'black']),
  pick: z.number().int().min(1).max(10).default(1),
  deckId: z.string().uuid(),
});

/**
 * POST /api/cards
 * Create a new card
 *
 * Body: { text: string, type: 'white' | 'black', pick?: number, deckId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const body = await request.json();
    const validation = createCardSchema.safeParse(body);

    if (!validation.success) {
      return zodErrorResponse(validation.error);
    }

    const { text, type, pick, deckId } = validation.data;

    // Check if user can edit the deck
    const canEdit = await canEditDeck(deckId, userId);
    if (!canEdit) {
      return ErrorResponses.forbidden(
        'You do not have permission to create cards in this deck'
      );
    }

    const [newCard] = await db
      .insert(card)
      .values({
        text,
        type,
        pick,
        deckId,
        userId,
      })
      .returning();

    return successResponse(
      {
        id: newCard.id,
        type: newCard.type,
        pick: newCard.pick,
        text: newCard.text,
        deck_id: newCard.deckId,
        created_at: newCard.createdAt.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating card:', error);
    return ErrorResponses.internalError();
  }
}
