'use server';

import { db } from '@/lib/db';
import { deck, deckShare } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { canShareDeck, canEditDeck } from '@/lib/auth/permissions';
import { shareDeckSchema, updateSharePermissionSchema, removeShareSchema } from '@/lib/schemas';

type Result = {
  success: boolean;
  error?: string;
};

type DeleteProps = {
  id: string;
};

export async function deleteDeck({ id }: DeleteProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Check if user can edit this deck
    const canEdit = await canEditDeck(id, userId);
    if (!canEdit) {
      return {
        success: false,
        error: 'You do not have permission to delete this deck',
      };
    }

    await db.delete(deck).where(eq(deck.id, id));

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
  name?: string;
  description?: string;
};

export async function updateDeck({
  id,
  name,
  description,
}: UpdateProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Check if user can edit this deck
    const canEdit = await canEditDeck(id, userId);
    if (!canEdit) {
      return {
        success: false,
        error: 'You do not have permission to update this deck',
      };
    }

    await db
      .update(deck)
      .set({
        name,
        description,
      })
      .where(eq(deck.id, id));

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

type ShareDeckProps = {
  deckId: string;
  sharedWithUserId: string;
  permission: 'view' | 'collaborate';
};

export async function shareDeck({
  deckId,
  sharedWithUserId,
  permission,
}: ShareDeckProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Validate input
    const validation = shareDeckSchema.safeParse({ deckId, sharedWithUserId, permission });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    // Check if user can share this deck
    const canShare = await canShareDeck(deckId, userId);
    if (!canShare) {
      return {
        success: false,
        error: 'You do not have permission to share this deck',
      };
    }

    // Check if already shared with this user
    const existingShare = await db.query.deckShare.findFirst({
      where: and(
        eq(deckShare.deckId, deckId),
        eq(deckShare.sharedWithUserId, sharedWithUserId)
      ),
    });

    if (existingShare) {
      return {
        success: false,
        error: 'Deck is already shared with this user',
      };
    }

    // Create share
    await db.insert(deckShare).values({
      deckId,
      sharedWithUserId,
      sharedByUserId: userId,
      permission,
    });

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

type UpdateSharePermissionProps = {
  shareId: string;
  permission: 'view' | 'collaborate';
};

export async function updateSharePermission({
  shareId,
  permission,
}: UpdateSharePermissionProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Validate input
    const validation = updateSharePermissionSchema.safeParse({ shareId, permission });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    // Get the share to check permissions
    const share = await db.query.deckShare.findFirst({
      where: eq(deckShare.id, shareId),
    });

    if (!share) {
      return {
        success: false,
        error: 'Share not found',
      };
    }

    // Check if user can share this deck (only owner can update permissions)
    const canShare = await canShareDeck(share.deckId, userId);
    if (!canShare) {
      return {
        success: false,
        error: 'You do not have permission to update this share',
      };
    }

    // Update permission
    await db
      .update(deckShare)
      .set({ permission })
      .where(eq(deckShare.id, shareId));

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

type RemoveShareProps = {
  shareId: string;
};

export async function removeShare({ shareId }: RemoveShareProps): Promise<Result> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Validate input
    const validation = removeShareSchema.safeParse({ shareId });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    // Get the share to check permissions
    const share = await db.query.deckShare.findFirst({
      where: eq(deckShare.id, shareId),
    });

    if (!share) {
      return {
        success: false,
        error: 'Share not found',
      };
    }

    // Check if user can share this deck (only owner can remove shares)
    const canShare = await canShareDeck(share.deckId, userId);
    if (!canShare) {
      return {
        success: false,
        error: 'You do not have permission to remove this share',
      };
    }

    // Delete share
    await db.delete(deckShare).where(eq(deckShare.id, shareId));

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
