import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Routes } from '@/lib/routes';
import { Deck } from '@/lib/supabase/api/deck';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Card className="flex flex-col p-6 justify-between">
      <h2 className="text-xl font-bold">{deck.name}</h2>
      <p className="text-sm text-muted-foreground">{deck.description}</p>
      <div className="flex flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {deck.cards.length} cards
        </p>
        <Link
          href={Routes.DECK(deck.id)}
          className={buttonVariants({ variant: 'default' })}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>
    </Card>
  );
}
