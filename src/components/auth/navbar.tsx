'use client';

import { Card } from '@/components/ui/card';
import { ThemeToggle } from '../theme-toggle';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { House } from 'lucide-react';

export function AuthNavbar() {
  const t = useTranslations();

  return (
    <Card className="flex flex-row items-center justify-between w-full px-6 py-2">
      <div className="flex flex-row items-center gap-3">
        <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
          <House />
        </Link>
        <Link
          href="/auth/sign-in"
          className={buttonVariants({ variant: 'ghost' })}
        >
          {t('authNav.signIn')}
        </Link>
        <Link
          href="/auth/sign-up"
          className={buttonVariants({ variant: 'ghost' })}
        >
          {t('authNav.signUp')}
        </Link>
      </div>
      <div className="scale-90">
        <ThemeToggle />
      </div>
    </Card>
  );
}
