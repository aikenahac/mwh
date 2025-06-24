import z from 'zod';
import { createClerkSupabaseClientServer } from '@/lib/supabase/server';

enum CardType {
  WHITE = 'white',
  BLACK = 'black',
}

export type Card = z.infer<typeof cardSchema>;
export const cardSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(CardType),
  text: z.string(),
  deck_id: z.string(),
  user_id: z.string(),
  created_at: z.string(),
});

export const cardsSchema = z.array(cardSchema);

export async function getCards(deckId: string) {
  const supabase = await createClerkSupabaseClientServer();
  const { data } = await supabase.from('card').select(`
    id,
    type,
    text,
    deck_id,
    user_id,
    created_at
  `).eq('deck_id', deckId);

  return cardsSchema.safeParse(data);
}
