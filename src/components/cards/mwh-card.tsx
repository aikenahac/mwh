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
        'aspect-[238/333] w-full p-4 sm:p-card-padding rounded-[12px] shadow-lg flex flex-col justify-between',
        card.type === 'white' ? 'bg-white text-black' : 'bg-black text-white',
        {
          'hover:scale-[101%] transition duration-200 cursor-pointer': !creator,
        },
      )}
    >
      <p className="text-sm sm:text-card-content-size font-extrabold text-mwh-card leading-tight">
        {card.text}
      </p>

      <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
        <p className="text-[6px] sm:text-card-footer-size font-bold">
          {t('appName')}
        </p>
        {card.type === 'black' && card.pick && card.pick > 1 && (
          <div className="font-bold text-white flex items-center gap-1">
            <span className="text-[8px] sm:text-xs">PICK</span>{' '}
            <div className="rounded-full h-4 w-4 sm:h-6 sm:w-6 bg-white text-black flex items-center justify-center">
              <p className="text-[10px] sm:text-sm">{card.pick}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
