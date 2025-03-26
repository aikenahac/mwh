import { CreateDeck } from '@/components/decks/create-deck';
import { DeckCard } from '@/components/decks/deck/deck-card';
import { Routes } from '@/lib/routes';
import { getDecks } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DecksPage() {
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);
  const {data: decks} = await getDecks(userId);
  const hasDecks = !!decks && decks.length > 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-row items-center justify-between w-full">
        <h1 className="text-2xl font-bold">Decks</h1>
        <CreateDeck />
      </div>
      <br />
      {hasDecks ? (
        decks.map((deck) => (
          <div key={deck.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <DeckCard deck={deck} />
          </div>
        ))
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
