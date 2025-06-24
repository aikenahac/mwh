import { appName } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MwhCard({
  type,
  text,
}: {
  type: 'black' | 'white';
  text: string;
}) {
  return (
    <div
      className={cn(
        'h-card-height w-card-width p-card-padding rounded-[12px] shadow-lg flex flex-col justify-between',
        type === 'white' ? 'bg-white text-black' : 'bg-black text-white',
      )}
    >
      <p className="text-card-content-size font-extrabold text-mwh-card">
        {text}
      </p>

      <div className="flex flex-row items-center gap-2">
        <p className="text-card-footer-size font-bold">{appName}</p>
      </div>
    </div>
  );
}
