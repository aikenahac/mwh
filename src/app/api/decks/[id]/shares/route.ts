import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { deckShare } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { canShareDeck } from '@/lib/auth/permissions';
import {
  successResponse,
  ErrorResponses,
  zodErrorResponse,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const shareSchema = z.object({
  username: z.string().min(1),
  permission: z.enum(['view', 'collaborate']),
});

/**
 * GET /api/decks/[id]/shares
 * List all shares for a deck (owner only)
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id: deckId } = await context.params;

    // Check if user can share this deck (owner only)
    const canShare = await canShareDeck(deckId, userId);
    if (!canShare) {
      return ErrorResponses.forbidden(
        'You do not have permission to view shares for this deck'
      );
    }

    const shares = await db.query.deckShare.findMany({
      where: eq(deckShare.deckId, deckId),
    });

    return successResponse(
      shares.map((share) => ({
        id: share.id,
        deck_id: share.deckId,
        shared_with_user_id: share.sharedWithUserId,
        shared_by_user_id: share.sharedByUserId,
        permission: share.permission,
        created_at: share.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching shares:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * POST /api/decks/[id]/shares
 * Share a deck with a user
 *
 * Body: { username: string, permission: 'view' | 'collaborate' }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id: deckId } = await context.params;

    const body = await request.json();
    const validation = shareSchema.safeParse(body);

    if (!validation.success) {
      return zodErrorResponse(validation.error);
    }

    const { username, permission } = validation.data;

    // Check if user can share this deck (owner only)
    const canShare = await canShareDeck(deckId, userId);
    if (!canShare) {
      return ErrorResponses.forbidden(
        'You do not have permission to share this deck'
      );
    }

    // Look up user by username in Clerk
    let sharedWithUserId: string;
    try {
      const clerk = await clerkClient();
      const users = await clerk.users.getUserList({ username: [username] });

      if (users.data.length === 0) {
        return ErrorResponses.badRequest(
          'User not found. Please check the username and try again.'
        );
      }

      sharedWithUserId = users.data[0].id;
    } catch {
      return ErrorResponses.internalError('Failed to lookup user. Please try again.');
    }

    // Prevent self-sharing
    if (sharedWithUserId === userId) {
      return ErrorResponses.badRequest('Cannot share deck with yourself');
    }

    // Check if already shared with this user
    const existingShare = await db.query.deckShare.findFirst({
      where: and(
        eq(deckShare.deckId, deckId),
        eq(deckShare.sharedWithUserId, sharedWithUserId)
      ),
    });

    if (existingShare) {
      return ErrorResponses.badRequest('Deck is already shared with this user');
    }

    // Create share
    const [newShare] = await db
      .insert(deckShare)
      .values({
        deckId,
        sharedWithUserId,
        sharedByUserId: userId,
        permission,
      })
      .returning();

    return successResponse(
      {
        id: newShare.id,
        deck_id: newShare.deckId,
        shared_with_user_id: newShare.sharedWithUserId,
        shared_by_user_id: newShare.sharedByUserId,
        permission: newShare.permission,
        created_at: newShare.createdAt.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error('Error sharing deck:', error);
    return ErrorResponses.internalError();
  }
}
