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

const initialState = {
  success: false,
  message: '',
};

export function CreateDeckDialog() {
  const [state, formAction, pending] = useActionState(createDeck, initialState);

  useEffect(() => {
    if (state?.message && state.message.length > 0) {
      if (state.success) {
        toast.success(state.message, {
          richColors: true,
        });
      } else {
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
          <span>Create Deck</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Deck</DialogTitle>
          <DialogDescription>
            Choose a name and add a description for your deck.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" action={formAction}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input id="name" name="name" placeholder="K-Pop Pack" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="I just wanna be your dog woof woof"
            />
          </div>
          <DialogFooter>
            <Button className="cursor-pointer" disabled={pending} type="submit">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
