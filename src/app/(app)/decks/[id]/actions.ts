'use server';

import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Result = {
  success: boolean;
  error?: string;
};

type DeleteProps = {
  id: string;
};

export async function deleteDeck({ id }: DeleteProps): Promise<Result> {
  try {
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
