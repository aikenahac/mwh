'use client';

import { Card } from '@/components/ui/card';
import { ThemeToggle } from '../theme-toggle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function AuthNavbar() {
  return (
    <Card className="flex flex-row items-center justify-between w-full px-6 py-2">
      <div className="flex flex-row items-center gap-3">
        <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
          <FontAwesomeIcon icon={faHome} />
        </Link>
        <Link
          href="/auth/sign-in"
          className={buttonVariants({ variant: 'ghost' })}
        >
          Sign In
        </Link>
        <Link
          href="/auth/sign-up"
          className={buttonVariants({ variant: 'ghost' })}
        >
          Sign Up
        </Link>
      </div>
      <div className="scale-90">
        <ThemeToggle />
      </div>
    </Card>
  );
}
