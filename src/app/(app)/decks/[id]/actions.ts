'use server';

import { createClerkSupabaseClientServer } from "@/lib/supabase/server";

type Result = {
  success: boolean;
  error?: string;
}

type DeleteProps = {
  id: string;
}

export async function deleteDeck({ id }: DeleteProps): Promise<Result> {
  const supabase = await createClerkSupabaseClientServer();

  const res = await supabase.from('deck').delete().eq('id', id);

  if (res.status >= 200 && res.status < 300) {
    return {
      success: true,
    }
  }

  if (res.error) {
    return {
      success: false,
      error: res.error ? res.error.message : 'Unknown error',
    }
  }

  return {
    success: true,
  }
}

type UpdateProps = {
  id: string;
  name?: string;
  description?: string;
}

export async function updateDeck({ id, name, description }: UpdateProps): Promise<Result> {
  const supabase = await createClerkSupabaseClientServer();

  const res = await supabase.from('deck').update({
    name,
    description,
  }).eq('id', id);

  if (res.status >= 200 && res.status < 300) {
    return {
      success: true,
    }
  }

  if (res.error) {
    return {
      success: false,
      error: res.error ? res.error.message : 'Unknown error',
    }
  }

  return {
    success: true,
  }
}