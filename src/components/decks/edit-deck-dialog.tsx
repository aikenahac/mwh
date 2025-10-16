'use client';

import { Button, buttonVariants } from '@/components/ui/button';
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
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { updateDeck } from '@/app/(app)/decks/[id]/actions';
import { Deck } from '@/lib/api/deck';
import { redirect } from 'next/navigation';
import { Routes } from '@/lib/routes';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';

const initialState = {
  success: false,
  message: '',
};

export function EditDeckDialog({ deck }: { deck: Deck }) {
  const t = useTranslations();

  const onSubmit = () => updateDeck({ id: deck.id, name, description });
  const [state, formAction, pending] = useActionState(onSubmit, initialState);

  const [name, setName] = useState<string>(deck.name);
  const [description, setDescription] = useState<string>(
    deck.description || '',
  );

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error, {
        richColors: true,
      });
    }

    if (state.success) {
      toast.success(t('deck.editDialog.success'), {
        richColors: true,
      });
      redirect(Routes.DECK(deck.id));
    }
  }, [state, deck.id, t]);

  return (
    <Dialog>
      <DialogTrigger>
        <div className={buttonVariants({ variant: 'outline' })}>
          <Pencil />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('deck.editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deck.editDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>{t('deck.editDialog.nameLabel')}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t('deck.editDialog.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('deck.editDialog.descriptionLabel')}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t('deck.editDialog.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <form action={formAction}>
              <Button
                className="cursor-pointer"
                disabled={pending}
                type="submit"
              >
                {t('deck.editDialog.updateButton')}
              </Button>
            </form>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
