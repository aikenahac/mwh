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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { updateDeck } from '@/app/(app)/decks/[id]/actions';
import { Deck } from '@/lib/supabase/api/deck';
import { redirect } from 'next/navigation';
import { Routes } from '@/lib/routes';

const initialState = {
  success: false,
  message: '',
};

export function EditDeckDialog({ deck }: { deck: Deck }) {
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
      toast.success('Deck updated successfully', {
        richColors: true,
      });
      redirect(Routes.DECK(deck.id));
    }
  }, [state, deck.id]);

  return (
    <Dialog>
      <DialogTrigger>
        <div className={buttonVariants({ variant: 'outline' })}>
          <FontAwesomeIcon icon={faPencil} />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>Update deck information.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="K-Pop Pack"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="I just wanna be your dog woof woof"
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
                Update
              </Button>
            </form>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
