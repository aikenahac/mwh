'use server';

import { BlackCardType, CardType, CardWithDeck } from "@/lib/supabase/api/card";
import { Deck } from "@/lib/supabase/api/deck";
import { createClerkSupabaseClientServer } from "@/lib/supabase/server";

type Props = {
  text: string;
  type: keyof typeof CardType;
  blackCardType?: keyof typeof BlackCardType;
  deck: Deck;
}

type Result = {
  success: boolean;
  error?: string;
  card?: CardWithDeck;
}

export async function createCard({ text, type, blackCardType, deck }: Props): Promise<Result> {
  const supabase = await createClerkSupabaseClientServer();

  const res = await supabase.from('card').insert({
    text,
    type,
    black_card_type: type === "black" ? blackCardType : undefined,
    deck_id: deck.id,
  }).select('*').limit(1).single();

  if (res.error || !res.data) {
    return {
      success: false,
      error: res.error ? res.error.message : 'Unknown error',
      card: undefined,
    }
  }

  return {
    success: true,
    error: undefined,
    card: {
      ...res.data,
      text: res.data.text!,
      deck: {
        id: res.data.deck_id,
        name: deck.name,
      },
    },
  }
}
