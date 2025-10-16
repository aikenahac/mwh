'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';

export async function deleteDeck(deckId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    throw new Error('Forbidden: Only superadmins can delete system decks');
  }

  // Verify the deck is a system deck
  const deckToDelete = await db.query.deck.findFirst({
    where: eq(deck.id, deckId),
  });

  if (!deckToDelete) {
    throw new Error('Deck not found');
  }

  if (deckToDelete.userId !== 'system') {
    throw new Error('Can only delete system decks from this page');
  }

  // Delete the deck (cards will be cascade deleted)
  await db.delete(deck).where(eq(deck.id, deckId));

  revalidatePath(Routes.ADMIN_SYSTEM_DECKS);
}
