'use client';

import { Card } from '@/components/ui/card';
import { ThemeToggle } from '../theme-toggle';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignIn } from '@fortawesome/free-solid-svg-icons';
import { buttonVariants } from '@/components/ui/button';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Routes } from '@/lib/routes';

export function Navbar() {
  const { theme } = useTheme();
  const path = usePathname();

  function getClassName(active: boolean) {
    return active ? buttonVariants({ variant: 'outline' }) : buttonVariants({ variant: 'ghost' });
  }

  return (
    <Card className="flex flex-row items-center justify-between w-full px-6">
      <div className="flex gap-3">
        <Link href="/" className={getClassName(path === Routes.HOME)}>
          Home
        </Link>
        <Link href="/decks" className={getClassName(path.startsWith(Routes.DECKS))}>
          Decks
        </Link>
      </div>
      <div className="flex gap-3">
        <SignedOut>
          <Link
            href="/auth/sign-in"
            className={buttonVariants({ variant: 'ghost' })}
          >
            <FontAwesomeIcon icon={faSignIn} />
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              baseTheme: theme === 'dark' ? dark : undefined,
            }}
          />
        </SignedIn>
        <ThemeToggle />
      </div>
    </Card>
  );
}
