import { MWHCard } from '@/components/cards/mwh-card';
import { PrintDeckDialog } from '@/components/decks/deck/print-dialog';
import { DeleteDeckDialog } from '@/components/decks/delete-deck-dialog';
import { EditDeckDialog } from '@/components/decks/edit-deck-dialog';
import { ShareDeckDialog } from '@/components/decks/share-deck-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Routes } from '@/lib/routes';
import { getDeckById } from '@/lib/api/deck';
import { getUserDeckPermissions } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: deckId } = await params;
  const { userId } = await auth();
  const t = await getTranslations();

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

  // Check user permissions for this deck
  const permissions = await getUserDeckPermissions(deckId, userId);

  // Redirect if user has no access
  if (!permissions.canView) {
    redirect(Routes.DECKS);
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            {deck.name}
            {permissions.isOwner && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(Owner)</span>
            )}
            {!permissions.isOwner && permissions.permission === 'view' && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(View Only)</span>
            )}
            {!permissions.isOwner && permissions.permission === 'collaborate' && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(Collaborator)</span>
            )}
          </h1>
          <p>{deck.description}</p>
        </div>
        <div className="flex flex-row items-center gap-2">
          {permissions.canEdit && <DeleteDeckDialog deckId={deck.id} />}
          <PrintDeckDialog cards={deck.cards} />
          {permissions.canEdit && <EditDeckDialog deck={deck} />}
          {permissions.isOwner && (
            <ShareDeckDialog deckId={deck.id} shares={deck.shares || []} isOwner={permissions.isOwner} />
          )}
          {permissions.canEdit && (
            <Link
              href={Routes.CARD_CREATE(deck.id)}
              className={buttonVariants({ variant: 'default' })}
            >
              {t('deck.addCard')}
            </Link>
          )}
        </div>
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
            permissions.canEdit ? (
              <Link href={Routes.CARD_EDIT(card.id)} key={card.id}>
                <MWHCard card={card} />
              </Link>
            ) : (
              <MWHCard card={card} key={card.id} />
            )
          ))}
        {deck.cards
          .filter((c) => c.type === 'white')
          .map((card) => (
            permissions.canEdit ? (
              <Link href={Routes.CARD_EDIT(card.id)} key={card.id}>
                <MWHCard card={card} />
              </Link>
            ) : (
              <MWHCard card={card} key={card.id} />
            )
          ))}
      </div>
    </div>
  );
}
