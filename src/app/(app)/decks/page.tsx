import { CreateDeck } from '@/components/decks/create-deck';
import { DeckCard } from '@/components/decks/deck/deck-card';
import { Routes } from '@/lib/routes';
import { getDecks } from '@/lib/supabase/api/deck';
import { cn } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DecksPage() {
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);
  const { data: decks } = await getDecks(userId);
  console.log('Rendering DecksPage with decks:', decks);
  const hasDecks = !!decks && decks.length > 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-row items-center justify-between w-full">
        <h1 className="text-2xl font-bold">Decks</h1>
        <CreateDeck />
      </div>
      <br />
      {hasDecks ? (
        <div
          className={cn(
            'grid w-full gap-3 overflow-hidden', // layout
            'grid-cols-1 sm:grid-cols-1 md:grid-cols-1', // mobile/tablet
            'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4', // desktop
            '2xl:gap-4', // extra gap for 2xl
          )}
        >
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full">
          <p className="text-xl font-bold">No decks found</p>
          <p className="text-sm text-muted-foreground">
            Create a new deck to get started
          </p>
        </div>
      )}
    </div>
  );
}
