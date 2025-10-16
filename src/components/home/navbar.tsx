'use client';

import { Card } from '@/components/ui/card';
import { ThemeToggle } from '../theme-toggle';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Routes } from '@/lib/routes';
import { useTranslations } from 'next-intl';
import { LogIn, Menu, Home, Layers } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

export function Navbar() {
  const { theme } = useTheme();
  const path = usePathname();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  function getClassName(active: boolean) {
    return active
      ? buttonVariants({ variant: 'outline' })
      : buttonVariants({ variant: 'ghost' });
  }

  const closeSheet = () => setOpen(false);

  return (
    <Card className="flex flex-row items-center justify-between w-full px-4 sm:px-6 py-2">
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-3">
        <Link href="/" className={getClassName(path === Routes.HOME)}>
          {t('nav.home')}
        </Link>
        <Link
          href="/decks"
          className={getClassName(
            path.startsWith(Routes.DECKS) || path.startsWith(Routes.CARDS),
          )}
        >
          {t('nav.decks')}
        </Link>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{t('appName')}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-6">
              <Link
                href="/"
                className={`${getClassName(path === Routes.HOME)} w-full justify-start`}
                onClick={closeSheet}
              >
                <Home className="mr-2 h-4 w-4" />
                {t('nav.home')}
              </Link>
              <Link
                href="/decks"
                className={`${getClassName(
                  path.startsWith(Routes.DECKS) ||
                    path.startsWith(Routes.CARDS),
                )} w-full justify-start`}
                onClick={closeSheet}
              >
                <Layers className="mr-2 h-4 w-4" />
                {t('nav.decks')}
              </Link>
              <SignedOut>
                <Link
                  href="/auth/sign-in"
                  className={`${buttonVariants({ variant: 'ghost' })} w-full justify-start`}
                  onClick={closeSheet}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('authNav.signIn')}
                </Link>
              </SignedOut>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Side Actions */}
      <div className="flex gap-4 items-center">
        <ThemeToggle />
        <SignedOut>
          <Link
            href="/auth/sign-in"
            className={`${buttonVariants({ variant: 'ghost' })} hidden md:flex`}
          >
            <LogIn className="h-5 w-5" />
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              baseTheme: theme === 'dark' ? dark : undefined,
            }}
          />
        </SignedIn>
      </div>
    </Card>
  );
}
