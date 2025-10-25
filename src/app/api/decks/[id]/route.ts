import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getDeckById } from '@/lib/api/deck';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isOwnerOfDeck } from '@/lib/auth/permissions';
import {
  successResponse,
  ErrorResponses,
  zodErrorResponse,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateDeckSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

/**
 * GET /api/decks/[id]
 * Get a specific deck by ID with all cards and share information
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await context.params;
    const result = await getDeckById(id, userId);

    if (result.error) {
      if (result.error.message.includes('permission')) {
        return ErrorResponses.forbidden(result.error.message);
      }
      return ErrorResponses.notFound('Deck');
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('Error fetching deck:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * PATCH /api/decks/[id]
 * Update a deck's name and/or description
 *
 * Body: { name?: string, description?: string }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await context.params;

    // Check ownership
    const isOwner = await isOwnerOfDeck(id, userId);
    if (!isOwner) {
      return ErrorResponses.forbidden('Only the owner can update deck metadata');
    }

    const body = await request.json();
    const validation = updateDeckSchema.safeParse(body);

    if (!validation.success) {
      return zodErrorResponse(validation.error);
    }

    const [updatedDeck] = await db
      .update(deck)
      .set({
        name: validation.data.name,
        description: validation.data.description,
      })
      .where(eq(deck.id, id))
      .returning();

    if (!updatedDeck) {
      return ErrorResponses.notFound('Deck');
    }

    return successResponse({
      id: updatedDeck.id,
      name: updatedDeck.name,
      description: updatedDeck.description,
      user_id: updatedDeck.userId,
      created_at: updatedDeck.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * DELETE /api/decks/[id]
 * Delete a deck (owner only)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await context.params;

    // Check ownership
    const isOwner = await isOwnerOfDeck(id, userId);
    if (!isOwner) {
      return ErrorResponses.forbidden('Only the owner can delete this deck');
    }

    await db.delete(deck).where(eq(deck.id, id));

    return successResponse({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return ErrorResponses.internalError();
  }
}
