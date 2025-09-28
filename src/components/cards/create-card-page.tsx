'use client';

import { Deck } from '@/lib/supabase/api/deck';
import { CreateCardEditor } from './create-card';
import { Routes } from '@/lib/routes';
import Link from 'next/link';
import { Button, buttonVariants } from '../ui/button';
import { useActionState, useEffect, useState } from 'react';
import { BlackCardType, CardType } from '@/lib/supabase/api/card';
import { createCard } from '@/app/(app)/cards/create/[deckId]/actions';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Layers } from 'lucide-react';

type Props = {
  deck: Deck;
};

const initialState = {
  success: false,
  error: undefined,
  card: undefined,
};

export function CreateCardPage({ deck }: Props) {
  const t = useTranslations();

  const [text, setText] = useState('');
  const [type, setType] = useState<keyof typeof CardType>('white');
  const [blackCardType, setBlackCardType] = useState<
    keyof typeof BlackCardType | undefined
  >(undefined);

  const onSubmit = () => createCard({ text, type, blackCardType, deck });

  const [state, formAction, pending] = useActionState(onSubmit, initialState);

  useEffect(() => {
    if (type === 'black') {
      setBlackCardType('normal');
    } else {
      setBlackCardType(undefined);
    }
  }, [type]);

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error, {
        richColors: true,
      });
    }

    if (state.success) {
      toast.success(t('card.create.success'), {
        richColors: true,
      });
      setText('Jungkook and Jimin cuddling');
      setType('white');
      setBlackCardType(undefined);
    }
  }, [state, t]);

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            {t('card.create.title')}
          </h1>
          <h2 className="text-md font-medium flex items-center gap-1">
            {t('card.create.deck')}{' '}
            <span className="font-bold">{deck.name}</span>
          </h2>
        </div>
        <div className="flex flex-row items-center gap-2">
          <Link
            href={Routes.DECK(deck.id)}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Layers />
          </Link>
          <form action={formAction}>
            <Button type="submit" disabled={pending}>
              {t('card.create.saveButton')}
            </Button>
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
