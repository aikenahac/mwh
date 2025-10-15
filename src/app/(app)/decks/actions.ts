'use server';

import { Routes } from '@/lib/routes';
import { createDeckFormSchema } from '@/lib/schemas';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

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
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
