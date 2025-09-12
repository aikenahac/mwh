'use server';

import { Routes } from '@/lib/routes';
import { createDeckFormSchema } from '@/lib/schemas';
import { createClerkSupabaseClientServer } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function createDeck(
  prevState: any,
  formData: FormData,
): Promise<{ success: false; message: string }> {
  const { userId } = await auth();
  console.log('User ID:', userId);

  if (!userId) redirect(Routes.SIGN_IN);

  const supabase = await createClerkSupabaseClientServer();

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

  const res = await supabase
    .from('deck')
    .insert({
      name: validatedFields.data.name,
    })
    .select('*');

  if (res.error) {
    return {
      success: false,
      message: res.error.message,
    };
  }

  redirect(Routes.DECK(res.data[0].id));
}
