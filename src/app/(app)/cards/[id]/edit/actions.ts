'use server';

import { BlackCardType, CardType } from '@/lib/api/card';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Result = {
  success: boolean;
  error?: string;
};

type DeleteProps = {
  id: string;
};

export async function deleteCard({ id }: DeleteProps): Promise<Result> {
  try {
    await db.delete(card).where(eq(card.id, id));

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
  text?: string;
  type?: keyof typeof CardType;
  blackCardType?: keyof typeof BlackCardType;
};

export async function updateCard({
  id,
  text,
  type,
  blackCardType,
}: UpdateProps): Promise<Result> {
  try {
    await db
      .update(card)
      .set({
        text,
        type,
        blackCardType,
      })
      .where(eq(card.id, id));

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
