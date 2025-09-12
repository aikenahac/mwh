'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { MWHCard } from './mwh-card';
import { BlackCardType, CardType } from '@/lib/supabase/api/card';

type Props = {
  text: string;
  type: keyof typeof CardType;
  blackCardType: keyof typeof BlackCardType | undefined;

  setType: (type: keyof typeof CardType) => void;
  setText: (text: string) => void;
  setBlackCardType: (blackCardType: keyof typeof BlackCardType) => void;
};

export function CreateCardEditor({
  text,
  type,
  blackCardType,
  setBlackCardType,
  setType,
  setText,
}: Props) {
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
        {type === 'black' && (
          <div className="flex flex-row gap-6 items-center justify-start">
            <Label htmlFor="card_text" className="text-right font-bold">
              Black Card Type
            </Label>
            <ToggleGroup type="single" value={blackCardType}>
              <ToggleGroupItem
                onClick={() => setBlackCardType('normal')}
                value="normal"
                aria-label="Toggle normal"
                className="cursor-pointer"
              >
                {/* <div className='w-4 h-4 rounded-md bg-white' /> */}
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem
                onClick={() => setBlackCardType('pick_2')}
                value="pick_2"
                aria-label="Toggle pick_2"
                className="cursor-pointer"
              >
                {/* <div className='w-4 h-4 rounded-md bg-black' /> */}
                Pick 2
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </Card>
      <Card className="w-full flex items-center justify-center lg:w-[35%]">
        <MWHCard text={text} type={type} blackCardType={blackCardType} />
      </Card>
    </div>
  );
}
