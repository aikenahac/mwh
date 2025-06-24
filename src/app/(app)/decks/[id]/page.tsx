import { MwhCard } from '@/components/cards/mwh-card';
import { CardContextMenu } from '@/components/decks/deck/card-menu';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { getDeckById } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: deckId } = await params;
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);

  const { data: deck, error } = await getDeckById(deckId);

  if (!deck) {
    return (
      <div>
        <h1 className="text-2xl font-bold flex items-center">{error.message}</h1>
      </div>
    );
  }

  const hasCards = !!deck.cards && deck.cards.length > 0;

  return (
    <div>
      <div className='flex flex-row items-center justify-between'>
        <div>
          <h1 className="text-2xl font-bold flex items-center">{deck.name}</h1>
          <p>{deck.description}</p>
        </div>
        {deck.user_id === userId && (
          <Link href={Routes.CARD_CREATE(deck.id)} className={buttonVariants({ variant: "default" })}>
            Add Card
          </Link>
        )}
      </div>
      {hasCards ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {deck.cards.map((card) => (
              <CardContextMenu key={card.id}>
                <MwhCard type={card.type} text={card.text} />
              </CardContextMenu>
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
