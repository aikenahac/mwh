'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { createDeck } from '@/app/(app)/decks/actions';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { useTranslations } from 'next-intl';

const initialState = {
  success: false,
  message: '',
};

export function CreateDeckDialog() {
  const t = useTranslations();

  const [state, formAction, pending] = useActionState(createDeck, initialState);

  useEffect(() => {
    if (state?.message && state.message.length > 0) {
      if (!state.success) {
        toast.error(state.message, {
          richColors: true,
        });
      }
    }
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <FontAwesomeIcon icon={faPlus} />
          <span>{t('deck.createDialog.title')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('deck.createDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deck.createDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" action={formAction}>
          <div className="space-y-2">
            <Label>{t('deck.createDialog.nameLabel')}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t('deck.createDialog.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('deck.createDialog.descriptionLabel')}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t('deck.createDialog.descriptionPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button className="cursor-pointer" disabled={pending} type="submit">
              {t('deck.createDialog.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
