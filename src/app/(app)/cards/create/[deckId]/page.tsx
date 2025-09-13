import { CreateCardPage } from '@/components/cards/create-card-page';
import { Routes } from '@/lib/routes';
import { getDeckById } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

export default async function CreateCardPageRoot({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const { userId } = await auth();

  const t = await getTranslations();

  if (!userId) redirect(Routes.SIGN_IN);

  if (!deckId) {
    toast.error(t('deck.unknownDeck'));
    redirect(Routes.DECKS);
  }

  const { data: deck } = await getDeckById(deckId);

  if (!deck) {
    return (
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          {t('deck.unknownDeck')}
        </h1>
      </div>
    );
  }

  return <CreateCardPage deck={deck} />;
}
