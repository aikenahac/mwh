'use server';

import { BlackCardType, CardType } from '@/lib/supabase/api/card';
import { createClerkSupabaseClientServer } from '@/lib/supabase/server';

type Result = {
  success: boolean;
  error?: string;
};

type DeleteProps = {
  id: string;
};

export async function deleteCard({ id }: DeleteProps): Promise<Result> {
  const supabase = await createClerkSupabaseClientServer();

  const res = await supabase.from('card').delete().eq('id', id);

  if (res.status >= 200 && res.status < 300) {
    return {
      success: true,
    };
  }

  if (res.error) {
    return {
      success: false,
      error: res.error ? res.error.message : 'Unknown error',
    };
  }

  return {
    success: true,
  };
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
  const supabase = await createClerkSupabaseClientServer();

  const res = await supabase
    .from('card')
    .update({
      text,
      type,
      black_card_type: blackCardType,
    })
    .eq('id', id);

  if (res.status >= 200 && res.status < 300) {
    return {
      success: true,
    };
  }

  if (res.error) {
    return {
      success: false,
      error: res.error ? res.error.message : 'Unknown error',
    };
  }

  return {
    success: true,
  };
}
