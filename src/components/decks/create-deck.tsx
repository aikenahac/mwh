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

export function CreateDeck() {
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
        {/* <Form {...form}>
          <form onSubmit={form.handleSubmit()} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="K-Pop Pack"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="I just wanna be your dog woof woof"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button className="cursor-pointer" type="submit">
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form> */}
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
        {/* <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="K-Pop Pack"
              className="col-span-3"
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="I just wanna be your doog woof woof"
              className="col-span-3"
              onChange={handleChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button className="cursor-pointer" onClick={() => handleSubmit()}>
            Create
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
