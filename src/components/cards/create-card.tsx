'use client';

import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { MWHCard } from './mwh-card';
import { CardType } from '@/lib/api/card';
import { Button } from '../ui/button';
import { BLACK_CARD_LINE } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { useTranslations } from 'next-intl';
import { Input } from '../ui/input';

type Props = {
  text: string;
  type: keyof typeof CardType;
  pick: number;

  setType: (type: keyof typeof CardType) => void;
  setText: (text: string) => void;
  setPick: (pick: number) => void;
};

export function CreateCardEditor({
  text,
  type,
  pick,
  setPick,
  setType,
  setText,
}: Props) {
  const t = useTranslations();
  const isCustomPick = pick > 4;

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
              aria-label={t('card.editor.toggleWhite')}
              className="cursor-pointer"
            >
              {t('card.editor.white')}
            </ToggleGroupItem>
            <ToggleGroupItem
              onClick={() => setType('black')}
              value="black"
              aria-label={t('card.editor.toggleBlack')}
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
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row gap-6 items-center justify-start">
              <Label htmlFor="card_pick" className="text-right font-bold">
                {t('card.editor.pickLabel')}
              </Label>
              <ToggleGroup
                type="single"
                value={isCustomPick ? 'custom' : pick.toString()}
              >
                <ToggleGroupItem
                  onClick={() => setPick(1)}
                  value="1"
                  aria-label={t('card.editor.togglePick1')}
                  className="cursor-pointer"
                >
                  1
                </ToggleGroupItem>
                <ToggleGroupItem
                  onClick={() => setPick(2)}
                  value="2"
                  aria-label={t('card.editor.togglePick2')}
                  className="cursor-pointer"
                >
                  2
                </ToggleGroupItem>
                <ToggleGroupItem
                  onClick={() => setPick(3)}
                  value="3"
                  aria-label={t('card.editor.togglePick3')}
                  className="cursor-pointer"
                >
                  3
                </ToggleGroupItem>
                <ToggleGroupItem
                  onClick={() => setPick(4)}
                  value="4"
                  aria-label={t('card.editor.togglePick4')}
                  className="cursor-pointer"
                >
                  4
                </ToggleGroupItem>
                <ToggleGroupItem
                  onClick={() => setPick(5)}
                  value="custom"
                  aria-label="Custom pick value"
                  className="cursor-pointer"
                >
                  N
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {isCustomPick && (
              <div className="flex flex-row gap-4 items-center">
                <Label htmlFor="custom_pick" className="text-right font-bold whitespace-nowrap">
                  {`${t("card.editor.toggleCustomValue")}:`}
                </Label>
                <Input
                  id="custom_pick"
                  type="number"
                  min={5}
                  max={10}
                  value={pick}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 5 && value <= 10) {
                      setPick(value);
                    }
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">(5-10)</span>
              </div>
            )}
          </div>
        )}
      </Card>
      <Card className="w-full flex items-center justify-center lg:w-[35%]">
        <MWHCard card={{ text, type, pick }} />
      </Card>
    </div>
  );
}
