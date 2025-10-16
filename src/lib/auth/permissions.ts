import { db } from '@/lib/db';
import { deck, deckShare } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type Permission = 'view' | 'collaborate';

export interface DeckPermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  isOwner: boolean;
  permission?: Permission;
}

/**
 * Check user's permissions for a specific deck
 */
export async function getUserDeckPermissions(
  deckId: string,
  userId: string
): Promise<DeckPermissions> {
  // Get the deck
  const deckResult = await db.query.deck.findFirst({
    where: eq(deck.id, deckId),
  });

  if (!deckResult) {
    return {
      canView: false,
      canEdit: false,
      canShare: false,
      isOwner: false,
    };
  }

  // Check if user is the owner
  const isOwner = deckResult.userId === userId;
  if (isOwner) {
    return {
      canView: true,
      canEdit: true,
      canShare: true,
      isOwner: true,
    };
  }

  // Check if deck is shared with user
  const share = await db.query.deckShare.findFirst({
    where: and(
      eq(deckShare.deckId, deckId),
      eq(deckShare.sharedWithUserId, userId)
    ),
  });

  if (!share) {
    return {
      canView: false,
      canEdit: false,
      canShare: false,
      isOwner: false,
    };
  }

  // User has share access
  return {
    canView: true,
    canEdit: share.permission === 'collaborate',
    canShare: false, // Only owner can share
    isOwner: false,
    permission: share.permission,
  };
}

/**
 * Check if user can view a deck
 */
export async function canViewDeck(deckId: string, userId: string): Promise<boolean> {
  const permissions = await getUserDeckPermissions(deckId, userId);
  return permissions.canView;
}

/**
 * Check if user can edit a deck or its cards
 */
export async function canEditDeck(deckId: string, userId: string): Promise<boolean> {
  const permissions = await getUserDeckPermissions(deckId, userId);
  return permissions.canEdit;
}

/**
 * Check if user can share a deck
 */
export async function canShareDeck(deckId: string, userId: string): Promise<boolean> {
  const permissions = await getUserDeckPermissions(deckId, userId);
  return permissions.canShare;
}

/**
 * Check if user is the owner of a deck
 */
export async function isOwnerOfDeck(deckId: string, userId: string): Promise<boolean> {
  const deckResult = await db.query.deck.findFirst({
    where: eq(deck.id, deckId),
  });

  if (!deckResult) {
    return false;
  }

  return deckResult.userId === userId;
}
