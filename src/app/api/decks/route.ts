import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getDecks } from '@/lib/api/deck';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { createDeckFormSchema } from '@/lib/schemas';
import {
  successResponse,
  errorResponse,
  ErrorResponses,
  zodErrorResponse,
} from '@/lib/api-response';

/**
 * GET /api/decks
 * List all decks for the authenticated user (owned + shared)
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const result = await getDecks(userId);

    if (!result.success) {
      return errorResponse('Failed to fetch decks', 500);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('Error fetching decks:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * POST /api/decks
 * Create a new deck
 *
 * Body: { name: string, description?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const body = await request.json();
    const validation = createDeckFormSchema.safeParse(body);

    if (!validation.success) {
      return zodErrorResponse(validation.error);
    }

    const [newDeck] = await db
      .insert(deck)
      .values({
        name: validation.data.name,
        description: validation.data.description,
        userId,
      })
      .returning();

    return successResponse(
      {
        id: newDeck.id,
        name: newDeck.name,
        description: newDeck.description,
        user_id: newDeck.userId,
        created_at: newDeck.createdAt.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error creating deck:', error);
    return ErrorResponses.internalError();
  }
}
