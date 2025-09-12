import { cn } from '@/lib/utils';
import { BlackCardType, CardType } from '@/lib/supabase/api/card';

type Props = {
  text: string;
  type: keyof typeof CardType;
  blackCardType?: keyof typeof BlackCardType;
  creator?: boolean;
};

export function MWHCard({ text, type, blackCardType, creator }: Props) {
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

      <div className="flex flex-row items-center justify-between gap-2">
        <p className="text-card-footer-size font-bold">Mess With Humanity</p>
        {blackCardType === 'pick_2' && (
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
