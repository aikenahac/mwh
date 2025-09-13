import { EditCardPage } from '@/components/cards/edit-card-page';
import { Routes } from '@/lib/routes';
import { getCardById } from '@/lib/supabase/api/card';
import { getDeckById } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

export default async function EditCardPageRoot({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect(Routes.SIGN_IN);

  if (!id) {
    toast.error('Card not found');
    redirect(Routes.DECKS);
  }

  const { data: card } = await getCardById(id);
  const { data: deck } = await getDeckById(card?.deck_id || '');

  if (!deck) {
    return (
      <div>
        <h1 className="text-2xl font-bold flex items-center">Unknown card</h1>
      </div>
    );
  }

  if (!card) {
    return (
      <div>
        <h1 className="text-2xl font-bold flex items-center">Unknown card</h1>
      </div>
    );
  }

  return <EditCardPage deck={deck} card={card} />;
}
