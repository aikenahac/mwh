import z from 'zod';
import { createClerkSupabaseClientServer } from '@/lib/supabase/server';
import { Deck } from './deck';

export const CardType = {
  white: 'white',
  black: 'black',
} as const;

export const BlackCardType = {
  normal: 'normal',
  pick_2: 'pick_2',
} as const;

export type Card = z.infer<typeof cardSchema>;
export const cardSchema = z.object({
  id: z.string(),
  type: z.enum(CardType),
  black_card_type: z.enum(BlackCardType).optional().nullish(),
  text: z.string().nullish(),
  deck_id: z.string(),
  created_at: z.string(),
});

export const cardsSchema = z.array(cardSchema);

export type CardWithDeck = Card & {
  deck: Pick<Deck, 'id' | 'name'>;
};

export async function getCardById(cardId: string) {
  const supabase = await createClerkSupabaseClientServer();
  const { data } = await supabase
    .from('card')
    .select(
      `
    id,
    type,
    black_card_type,
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
