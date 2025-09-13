'use client';

import { Routes } from '@/lib/routes';
import Link from 'next/link';
import { Button, buttonVariants } from '../ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { CreateCardEditor } from './create-card';
import { Deck } from '@/lib/supabase/api/deck';
import { useActionState, useEffect, useState } from 'react';
import { BlackCardType, Card, CardType } from '@/lib/supabase/api/card';
import { DeleteCardDialog } from './delete-card-dialog';
import { updateCard } from '@/app/(app)/cards/[id]/edit/actions';
import { toast } from 'sonner';

type Props = {
  deck: Deck;
  card: Card;
};

const initialState = {
  success: false,
  error: undefined,
};

export function EditCardPage({ deck, card }: Props) {
  const [text, setText] = useState(card.text || 'Jungkook and Jimin cuddling');
  const [type, setType] = useState<keyof typeof CardType>(card.type || 'white');
  const [blackCardType, setBlackCardType] = useState<
    keyof typeof BlackCardType | undefined
  >(card.black_card_type || card.type === 'black' ? 'normal' : undefined);

  const onSubmit = () => updateCard({ id: card.id, text, type, blackCardType });
  const [state, formAction, pending] = useActionState(onSubmit, initialState);

  useEffect(() => {
    if (type === "black") {
      setBlackCardType("normal");
    } else {
      setBlackCardType(undefined);
    }
  }, [type])

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error, {
        richColors: true,
      });
    }

    if (state.success) {
      toast.success('Card updated successfully', {
        richColors: true,
      });
    }
  }, [state]);

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
          <DeleteCardDialog cardId={card.id} deckId={deck.id} />
          <form action={formAction}>
            <Button type='submit' disabled={pending}>Save</Button>
          </form>
        </div>
      </div>

      <br />

      <CreateCardEditor
        text={text}
        type={type}
        blackCardType={blackCardType}
        setBlackCardType={setBlackCardType}
        setText={setText}
        setType={setType}
      />
    </div>
  );
}
