'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { MwhCard } from './mwh-card';
import { Button } from '../ui/button';
import { useCreateClerkSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { redirect } from 'next/navigation';
import { Routes } from '@/lib/routes';

export function CreateCardEditor({ deckId }: { deckId: string }) {
  const supabase = useCreateClerkSupabaseClient();
  const { userId } = useAuth();

  const [type, setType] = useState<'black' | 'white'>('white');
  const [text, setText] = useState('Jungkook and Jimin cuddling');

  async function createCard() {
    const res = await supabase
      .from('card')
      .insert({ type, text, user_id: userId, deck_id: deckId })
      .select('*');

    return res;
  }

  async function createCardAndReturn() {
    const res = await createCard();

    console.log(res);
    if (res.error || !res.data || !res.data[0]) {
      toast.error(res.error?.message ?? 'An error occurred');
      return;
    }
    toast('Card created successfully');
    redirect(Routes.DECK(deckId));
  }

  return (
    <div className="flex flex-col items-start justify-between w-full gap-4 lg:flex-row">
      <Card className="w-full flex items-start justify-center lg:w-[65%] p-6">
        <div className="flex flex-row gap-6 items-center justify-start">
          <Label htmlFor="card_text" className="text-right font-bold">
            Card Type
          </Label>
          <ToggleGroup type="single" value={type}>
            <ToggleGroupItem
              onClick={() => setType('white')}
              value="white"
              aria-label="Toggle white"
              className="cursor-pointer"
            >
              {/* <div className='w-4 h-4 rounded-md bg-white' /> */}
              White
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setType('black')}
              value="black"
              aria-label="Toggle black"
              className="cursor-pointer"
            >
              {/* <div className='w-4 h-4 rounded-md bg-black' /> */}
              Black
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Label htmlFor="card_text" className="text-right font-bold">
          Card Text
        </Label>
        <Input
          id="card_text"
          name="card_text"
          defaultValue={text}
          className="col-span-3"
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-row gap-4 justify-end items-center w-full">
          <Button onClick={createCardAndReturn}>Create</Button>
          <Button>Save & Create Another</Button>
        </div>
      </Card>
      <Card className="w-full flex items-center justify-center lg:w-[35%]">
        <MwhCard text={text} type={type} />
      </Card>
    </div>
  );
}
