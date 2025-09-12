import { CreateCardEditor } from '@/components/cards/create-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { getDeckById } from '@/lib/supabase/api/deck';
import { auth } from '@clerk/nextjs/server';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

export default async function CreateCardPage({
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

  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">Create Card</h1>
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
          <Button>Create</Button>
          <Button>Save & Create Another</Button>
        </div>
      </div>

      <br />

      <CreateCardEditor />
    </div>
  );
}
