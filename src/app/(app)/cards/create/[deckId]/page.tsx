import { CreateCardPage } from '@/components/cards/create-card-page';
import { Routes } from '@/lib/routes';
import { getDeckById } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

export default async function CreateCardPageRoot({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);

  if (!deckId) {
    toast.error('Deck not found');
    redirect(Routes.DECKS);
  }

  const { data: deck } = await getDeckById(deckId);

  if (!deck) {
    return (
      <div>
        <h1 className="text-2xl font-bold flex items-center">Unknown deck</h1>
      </div>
    );
  }

  return <CreateCardPage deck={deck} />
}
