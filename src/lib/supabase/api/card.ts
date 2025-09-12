import z from 'zod';
import { createClerkSupabaseClientServer } from '@/lib/supabase/server';

export const CardType = {
  white: 'white',
  black: 'black',
} as const;

export type Card = z.infer<typeof cardSchema>;
export const cardSchema = z.object({
  id: z.string(),
  type: z.enum(CardType),
  text: z.string(),
  deck_id: z.string(),
  created_at: z.string(),
});

export const cardsSchema = z.array(cardSchema);

export async function getCardById(cardId: string) {
  const supabase = await createClerkSupabaseClientServer();
  const { data } = await supabase
    .from('card')
    .select(
      `
    id,
    type,
    text,
    deck_id,
    created_at
  `,
    )
    .eq('id', cardId)
    .limit(1)
    .single();

  return cardSchema.safeParse(data);
}
