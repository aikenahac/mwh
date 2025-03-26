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
    </div>
  );
}
