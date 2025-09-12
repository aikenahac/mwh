import z from 'zod';
import { createClerkSupabaseClientServer } from '@/lib/supabase/server';
import { Result } from '@/lib/utils';
import { cardSchema } from './card';

export type Deck = z.infer<typeof deckSchema>;
export const deckSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    user_id: z.string(),
    card: z.array(cardSchema),
    created_at: z.string(),
  })
  .transform((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    user_id: d.user_id,
    cards: d.card,
    created_at: d.created_at,
  }));

const decksSchema = z.array(deckSchema);

export async function getDecks(userId: string) {
  const supabase = await createClerkSupabaseClientServer();
  const { data } = await supabase
    .from('deck')
    .select(
      `
    id,
    name,
    description,
    user_id,
    created_at,

    card(
      id,
      type,
      black_card_type,
      text,
      deck_id,
      created_at
    ) as cards
  `,
    )
    .eq('user_id', userId);

  console.log('Decks data:', data);

  const res = decksSchema.safeParse(data);

  console.log('Parsed decks:', res);

  return res;
}

export async function getDeckById(id: string): Promise<Result<Deck, Error>> {
  const supabase = await createClerkSupabaseClientServer();

  if (!id) {
    return {
      data: null,
      error: Error('Deck ID not found'),
    };
  }

  const { data } = await supabase
    .from('deck')
    .select(
      `
    id,
    name,
    description,
    user_id,
    created_at,

    card(
      id,
      type,
      black_card_type,
      text,
      deck_id,
      created_at
    ) as cards
  `,
    )
    .eq('id', id);
  if (!data || data.length === 0) {
    return {
      data: null,
      error: new Error('Deck not found'),
    };
  }

  const parsed = deckSchema.safeParse(data[0]);
  if (!parsed.success) {
    return {
      data: null,
      error: new Error('Deck not found'),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}
