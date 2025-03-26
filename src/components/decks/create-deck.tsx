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
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useCreateClerkSupabaseClient } from '@/lib/supabase/client';
import { toast } from "sonner"
import { Routes } from '@/lib/routes';
import { redirect } from 'next/navigation';

export function CreateDeck() {
  const supabase = useCreateClerkSupabaseClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
      console.log('changing');
      console.log("current:", name)
    if (name === 'name') {
      console.log('name changed');
      setName(value);
    } else if (name === 'description') {
      console.log('description changed');
      setDescription(value);
    }
  }

  async function handleSubmit() {
    console.log('handleSubmit called');
    if (!name || name.length === 0) {
      console.log('no name');
      toast.error("Name is required");
      return;
    }
    if (!description || description.length === 0) {
      console.log('no description');
      toast.error("Description is required");
      return;
    }
    console.log('inserting deck');
    const res = await supabase.from('deck').insert({ name, description }).select('*');
    console.log(res)
    if (res.error || !res.data || !res.data[0]) {
      toast.error(res.error?.message ?? "An error occurred");
      return;
    }
    toast("Deck created successfully!");
    redirect(`${Routes.DECKS}/${res.data[0].id}`);
  };

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
          <div className="grid gap-4 py-4">
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
                name='description'
                placeholder="I just wanna be your doog woof woof"
                className="col-span-3"
                onChange={handleChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className='cursor-pointer' onClick={() => handleSubmit()}>Create</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
