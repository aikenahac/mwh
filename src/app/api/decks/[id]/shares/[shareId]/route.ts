import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { deckShare } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { canShareDeck } from '@/lib/auth/permissions';
import {
  successResponse,
  ErrorResponses,
  zodErrorResponse,
} from '@/lib/api-response';

type RouteContext = {
  params: Promise<{ id: string; shareId: string }>;
};

const updatePermissionSchema = z.object({
  permission: z.enum(['view', 'collaborate']),
});

/**
 * PATCH /api/decks/[id]/shares/[shareId]
 * Update share permission
 *
 * Body: { permission: 'view' | 'collaborate' }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id: deckId, shareId } = await context.params;

    // Get the share to check it exists
    const share = await db.query.deckShare.findFirst({
      where: eq(deckShare.id, shareId),
    });

    if (!share) {
      return ErrorResponses.notFound('Share');
    }

    // Verify the share belongs to the deck
    if (share.deckId !== deckId) {
      return ErrorResponses.badRequest('Share does not belong to this deck');
    }

    // Check if user can share this deck (owner only)
    const canShare = await canShareDeck(deckId, userId);
    if (!canShare) {
      return ErrorResponses.forbidden(
        'You do not have permission to update this share'
      );
    }

    const body = await request.json();
    const validation = updatePermissionSchema.safeParse(body);

    if (!validation.success) {
      return zodErrorResponse(validation.error);
    }

    const [updatedShare] = await db
      .update(deckShare)
      .set({ permission: validation.data.permission })
      .where(eq(deckShare.id, shareId))
      .returning();

    if (!updatedShare) {
      return ErrorResponses.notFound('Share');
    }

    return successResponse({
      id: updatedShare.id,
      deck_id: updatedShare.deckId,
      shared_with_user_id: updatedShare.sharedWithUserId,
      shared_by_user_id: updatedShare.sharedByUserId,
      permission: updatedShare.permission,
      created_at: updatedShare.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating share permission:', error);
    return ErrorResponses.internalError();
  }
}

/**
 * DELETE /api/decks/[id]/shares/[shareId]
 * Remove a share
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const { id: deckId, shareId } = await context.params;

    // Get the share to check it exists
    const share = await db.query.deckShare.findFirst({
      where: eq(deckShare.id, shareId),
    });

    if (!share) {
      return ErrorResponses.notFound('Share');
    }

    // Verify the share belongs to the deck
    if (share.deckId !== deckId) {
      return ErrorResponses.badRequest('Share does not belong to this deck');
    }

    // Check if user can share this deck (owner only)
    const canShare = await canShareDeck(deckId, userId);
    if (!canShare) {
      return ErrorResponses.forbidden(
        'You do not have permission to remove this share'
      );
    }

    await db.delete(deckShare).where(eq(deckShare.id, shareId));

    return successResponse({ message: 'Share removed successfully' });
  } catch (error) {
    console.error('Error removing share:', error);
    return ErrorResponses.internalError();
  }
}
