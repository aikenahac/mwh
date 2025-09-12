import { cn } from '@/lib/utils';
import { CardType } from '@/lib/supabase/api/card';

type Props = {
  text: string;
  type: keyof typeof CardType;
  creator?: boolean;
};

export function MWHCard({ text, type, creator }: Props) {
  return (
    <div
      className={cn(
        'h-card-height w-card-width p-card-padding rounded-[12px] shadow-lg flex flex-col justify-between',
        type === 'white' ? 'bg-white text-black' : 'bg-black text-white',
        {
          'hover:scale-[101%] transition duration-200 cursor-pointer': !creator,
        },
      )}
    >
      <p className="text-card-content-size font-extrabold text-mwh-card">
        {text}
      </p>

      <div className="flex flex-row items-center gap-2">
        <p className="text-card-footer-size font-bold">Mess With Humanity</p>
      </div>
    </div>
  );
}
