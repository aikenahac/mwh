'use client';

import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { MWHCard } from './mwh-card';
import { BlackCardType, CardType } from '@/lib/api/card';
import { Button } from '../ui/button';
import { BLACK_CARD_LINE } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();

  return (
    <div className="flex flex-col items-start justify-between w-full gap-4 lg:flex-row">
      <Card className="w-full flex items-start justify-center lg:w-[65%] p-6">
        <div className="flex flex-row gap-6 items-center justify-start">
          <Label htmlFor="card_text" className="text-right font-bold">
            {t('card.editor.typeLabel')}
          </Label>
          <ToggleGroup type="single" value={type}>
            <ToggleGroupItem
              onClick={() => setType('white')}
              value="white"
              aria-label="Toggle white"
              className="cursor-pointer"
            >
              {t('card.editor.white')}
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setType('black')}
              value="black"
              aria-label="Toggle black"
              className="cursor-pointer"
            >
              {t('card.editor.black')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2 flex-1 w-full">
          <Label htmlFor="card_text" className="text-right font-bold">
            {t('card.editor.textLabel')}
          </Label>
          <div className="w-full flex-1 flex flex-row gap-4">
            <Textarea
              id="card_text"
              name="card_text"
              value={text}
              className="col-span-3"
              placeholder={t('card.editor.textPlaceholder')}
              onChange={(e) => setText(e.target.value)}
            />
            {type === 'black' && (
              <Button onClick={() => setText(`${text} ${BLACK_CARD_LINE}`)}>
                {t('card.editor.addLine')}
              </Button>
            )}
          </div>
        </div>
        {type === 'black' && (
          <div className="flex flex-row gap-6 items-center justify-start">
            <Label htmlFor="card_text" className="text-right font-bold">
              {t('card.editor.blackCardTypeLabel')}
            </Label>
            <ToggleGroup type="single" value={blackCardType}>
              <ToggleGroupItem
                onClick={() => setBlackCardType('normal')}
                value="normal"
                aria-label="Toggle normal"
                className="cursor-pointer"
              >
                {t('card.editor.normal')}
              </ToggleGroupItem>
              <ToggleGroupItem
                onClick={() => setBlackCardType('pick_2')}
                value="pick_2"
                aria-label="Toggle pick_2"
                className="cursor-pointer"
              >
                {t('card.editor.pick2')}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </Card>
      <Card className="w-full flex items-center justify-center lg:w-[35%]">
        <MWHCard card={{ text, type, black_card_type: blackCardType }} />
      </Card>
    </div>
  );
}
