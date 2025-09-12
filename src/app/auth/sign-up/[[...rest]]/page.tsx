'use client';

import { Routes } from '@/lib/routes';
import { SignUp, useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';

export default function Home() {
  const { user } = useUser();
  const { theme } = useTheme();

  if (user) redirect(Routes.HOME);

  return (
    <Card className="p-0">
      <SignUp
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
        }}
      />
    </Card>
  );
}
