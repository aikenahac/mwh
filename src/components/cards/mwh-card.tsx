import { cn } from '@/lib/utils';
import { Card } from '@/lib/api/card';
import { useTranslations } from 'next-intl';

type Props = {
  creator?: boolean;
  card: Partial<Card>;
};

export function MWHCard({ creator, card }: Props) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        'h-card-height w-card-width p-card-padding rounded-[12px] shadow-lg flex flex-col justify-between',
        card.type === 'white' ? 'bg-white text-black' : 'bg-black text-white',
        {
          'hover:scale-[101%] transition duration-200 cursor-pointer': !creator,
        },
      )}
    >
      <p className="text-card-content-size font-extrabold text-mwh-card">
        {card.text}
      </p>

      <div className="flex flex-row items-center justify-between gap-2">
        <p className="text-card-footer-size font-bold">{t('appName')}</p>
        {card.black_card_type === 'pick_2' && (
          <div className="font-bold text-white flex items-center gap-1">
            PICK{' '}
            <div className="rounded-full h-6 w-6 bg-white text-black flex items-center justify-center">
              <p>2</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
