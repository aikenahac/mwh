'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '@/lib/utils';

export function CreateCardEditor() {
  const [text, setText] = useState('Jungkook and Jimin cuddling');
  const [type, setType] = useState<'black' | 'white'>('white');

  return (
    <div className="flex flex-col items-start justify-between w-full gap-4 lg:flex-row">
      <Card className="w-full flex items-start justify-center lg:w-[65%] p-6">
        <div className='flex flex-row gap-6 items-center justify-start'>
          <Label htmlFor="card_text" className="text-right font-bold">
            Card Type
          </Label>
          <ToggleGroup type="single" value={type}>
            <ToggleGroupItem onClick={() => setType("white")} value="white" aria-label="Toggle white" className='cursor-pointer'>
              {/* <div className='w-4 h-4 rounded-md bg-white' /> */}
              White
            </ToggleGroupItem>
            <ToggleGroupItem onClick={() => setType("black")} value="black" aria-label="Toggle black" className='cursor-pointer'>
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
        <div className={cn(
          "h-card-height w-card-width p-card-padding rounded-[12px] shadow-lg flex flex-col justify-between",
          type === 'white' ? 'bg-white text-black' : 'bg-black text-white'
        )}>
          <p className="text-card-content-size font-extrabold text-mwh-card">
            {text}
          </p>

          <div className='flex flex-row items-center gap-2'>
            <p className='text-card-footer-size font-bold'>Neki Against Humanity</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
