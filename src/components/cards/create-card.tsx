'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { MWHCard } from './mwh-card';
import { CardType } from '@/lib/supabase/api/card';

type Props = {
  textProp?: string;
  typeProp?: keyof typeof CardType;
};

export function CreateCardEditor({ textProp, typeProp }: Props) {
  const [text, setText] = useState(textProp ?? 'Jungkook and Jimin cuddling');
  const [type, setType] = useState<keyof typeof CardType>(typeProp ?? 'white');

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
      </Card>
      <Card className="w-full flex items-center justify-center lg:w-[35%]">
        <MWHCard text={text} type={type} />
      </Card>
    </div>
  );
}
