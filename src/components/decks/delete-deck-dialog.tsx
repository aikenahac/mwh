'use client';

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
import { deleteDeck } from '@/app/(app)/decks/[id]/actions';

type Props = {
  deckId: string;
};

const initialState = {
  success: false,
  error: undefined,
};

export function DeleteDeckDialog({ deckId }: Props) {
  const onSubmit = () => deleteDeck({ id: deckId });
  const [state, formAction, pending] = useActionState(onSubmit, initialState);

  useEffect(() => {
    if (!state.success && state.error) {
      toast.error(state.error, {
        richColors: true,
      });
    }

    if (state.success) {
      toast.success('Deck deleted successfully', {
        richColors: true,
      });
      redirect(Routes.DECKS);
    }
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger>
        <div className={buttonVariants({ variant: 'destructive-outline' })}>
          <FontAwesomeIcon icon={faTrash} />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete deck?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this deck? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            className={buttonVariants({ variant: 'outline' })}
            disabled={pending}
          >
            Cancel
          </DialogClose>
          <form action={formAction}>
            <Button variant="destructive" disabled={pending}>
              Delete
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
