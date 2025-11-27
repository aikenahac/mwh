'use server';

import { Routes } from '@/lib/routes';
import { createDeckFormSchema } from '@/lib/schemas';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getDecks } from '@/lib/api/deck';

export async function createDeck(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData,
): Promise<{ success: false; message: string }> {
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);

  const validatedFields = createDeckFormSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!validatedFields.data) {
    return {
      success: false,
      message: 'There was an error. Please check your input',
    };
  }

  try {
    const [newDeck] = await db
      .insert(deck)
      .values({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        userId,
      })
      .returning();

    redirect(Routes.DECK(newDeck.id));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function exportAllDecksAsJSON(): Promise<string> {
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);

  const { data: decks } = await getDecks(userId);

  if (!decks || decks.length === 0) {
    return JSON.stringify([]);
  }

  // Transform decks into the import format
  // Use pack numbers starting at 300 to avoid conflicts with official CAH packs
  const exportData = decks.map((deck, index) => ({
    name: deck.name,
    white: deck.cards
      .filter((card) => card.type === 'white')
      .map((card) => ({
        text: card.text || '',
        pack: index + 300,
      })),
    black: deck.cards
      .filter((card) => card.type === 'black')
      .map((card) => ({
        text: card.text || '',
        pick: card.pick || 1,
        pack: index + 300,
      })),
  }));

  return JSON.stringify(exportData, null, 2);
}
