import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getCardById } from '@/lib/api/card';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { canEditDeck, canViewDeck } from '@/lib/auth/permissions';
import {
  successResponse,
  ErrorResponses,
  zodErrorResponse,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateCardSchema = z.object({
  text: z.string().min(1).optional(),
  type: z.enum(['white', 'black']).optional(),
  pick: z.number().int().min(1).max(10).optional(),
});

/**
 * GET /api/cards/[id]
 * Get a specific card by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await context.params;
    const result = await getCardById(id);

    if (!result.success || !result.data) {
      return ErrorResponses.notFound('Card');
    }

    const cardData = result.data;

    // Check if user can view the deck this card belongs to
    const canView = await canViewDeck(cardData.deck_id, userId);
    if (!canView) {
      return ErrorResponses.forbidden('You do not have permission to view this card');
    }

    return successResponse(cardData);
  } catch (error) {
    console.error('Error fetching card:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * PATCH /api/cards/[id]
 * Update a card's text, type, and/or pick value
 *
 * Body: { text?: string, type?: 'white' | 'black', pick?: number }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await context.params;

    // Get the card to find its deck
    const cardData = await db.query.card.findFirst({
      where: eq(card.id, id),
    });

    if (!cardData) {
      return ErrorResponses.notFound('Card');
    }

    // Check if user can edit the deck
    const canEdit = await canEditDeck(cardData.deckId, userId);
    if (!canEdit) {
      return ErrorResponses.forbidden('You do not have permission to update this card');
    }

    const body = await request.json();
    const validation = updateCardSchema.safeParse(body);

    if (!validation.success) {
      return zodErrorResponse(validation.error);
    }

    const [updatedCard] = await db
      .update(card)
      .set({
        text: validation.data.text,
        type: validation.data.type,
        pick: validation.data.pick,
      })
      .where(eq(card.id, id))
      .returning();

    if (!updatedCard) {
      return ErrorResponses.notFound('Card');
    }

    return successResponse({
      id: updatedCard.id,
      type: updatedCard.type,
      pick: updatedCard.pick,
      text: updatedCard.text,
      deck_id: updatedCard.deckId,
      created_at: updatedCard.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating card:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * DELETE /api/cards/[id]
 * Delete a card
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await context.params;

    // Get the card to find its deck
    const cardData = await db.query.card.findFirst({
      where: eq(card.id, id),
    });

    if (!cardData) {
      return ErrorResponses.notFound('Card');
    }

    // Check if user can edit the deck
    const canEdit = await canEditDeck(cardData.deckId, userId);
    if (!canEdit) {
      return ErrorResponses.forbidden('You do not have permission to delete this card');
    }

    await db.delete(card).where(eq(card.id, id));

    return successResponse({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    return ErrorResponses.internalError();
  }
}
