import { CreateCardEditor } from '@/components/cards/create-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { getCardById } from '@/lib/supabase/api/card';
import { getDeckById } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

export default async function EditCardPage({
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

  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">Edit Card</h1>
          <h2 className="text-md font-medium flex items-center gap-1">
            for <span className="font-bold">{deck.name}</span>
          </h2>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Link
            href={Routes.DECK(deck.id)}
            className={buttonVariants({ variant: 'outline' })}
          >
            <FontAwesomeIcon icon={faLayerGroup} />
          </Link>
          <Button>Save</Button>
        </div>
      </div>

      <br />

      <CreateCardEditor textProp={card.text} typeProp={card.type} />
    </div>
  );
}
