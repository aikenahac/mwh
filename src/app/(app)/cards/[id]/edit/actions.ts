"use server";

import { createClerkSupabaseClientServer } from "@/lib/supabase/server";

type Result = {
  success: boolean;
  error?: string;
}

type DeleteProps = {
  id: string;
}

export async function deleteCard({ id }: DeleteProps): Promise<Result> {
  const supabase = await createClerkSupabaseClientServer();

  console.log('Deleting card with id:', id);

  const res = await supabase.from('card').delete().eq('id', id);

  console.log('Delete response:', res);

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