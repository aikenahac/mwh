import { MWHCard } from '@/components/cards/mwh-card';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { getDeckById } from '@/lib/supabase/api/deck';
import { cn } from '@/lib/utils';
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
        <h1 className="text-2xl font-bold flex items-center">
          {error.message}
        </h1>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center">{deck.name}</h1>
          <p>{deck.description}</p>
        </div>
        {deck.user_id === userId && (
          <Link
            href={Routes.CARD_CREATE(deck.id)}
            className={buttonVariants({ variant: 'default' })}
          >
            Add Card
          </Link>
        )}
      </div>
      <div
        className={cn(
          'grid w-full h-full gap-3 overflow-hidden py-6', // layout
          'grid-cols-1 sm:grid-cols-1 md:grid-cols-2', // mobile/tablet
          'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5', // desktop
          '2xl:gap-4', // extra gap for 2xl
        )}
      >
        {deck.cards
          .filter((c) => c.type === 'black')
          .map((card) => (
            <Link href={Routes.CARD_EDIT(card.id)} key={card.id}>
              <MWHCard card={card} />
            </Link>
          ))}
        {deck.cards
          .filter((c) => c.type === 'white')
          .map((card) => (
            <Link href={Routes.CARD_EDIT(card.id)} key={card.id}>
              <MWHCard card={card} />
            </Link>
          ))}
      </div>
    </div>
  );
}
