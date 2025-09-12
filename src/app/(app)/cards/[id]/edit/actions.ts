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

  const res = await supabase.from('card').delete().eq('id', id);

  if (res.error || !res.data) {
    return {
      success: false,
      error: res.error ? res.error.message : 'Unknown error',
    }
  }

  return {
    success: true,
  }
}