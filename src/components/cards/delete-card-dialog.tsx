import { Routes } from '@/lib/routes';
import { redirect } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button, buttonVariants } from '../ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { deleteCard } from '@/app/(app)/cards/[id]/edit/actions';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type Props = {
  cardId: string;
  deckId: string;
};

const initialState = {
  success: false,
  error: undefined,
};

export function DeleteCardDialog({ cardId, deckId }: Props) {
  const t = useTranslations();

  const onSubmit = () => deleteCard({ id: cardId });
  const [state, formAction, pending] = useActionState(onSubmit, initialState);

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error, {
        richColors: true,
      });
    }

    if (state.success) {
      toast.success(t('card.deleteDialog.success'), {
        richColors: true,
      });
      redirect(Routes.DECK(deckId));
    }
  }, [state, deckId, t]);

  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'destructive-outline' }))}>
          <FontAwesomeIcon icon={faTrash} />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('card.deleteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('card.deleteDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            className={buttonVariants({ variant: 'outline' })}
            disabled={pending}
          >
            {t('card.deleteDialog.cancelButton')}
          </DialogClose>
          <form action={formAction}>
            <Button variant="destructive" disabled={pending}>
              {t('card.deleteDialog.deleteButton')}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
