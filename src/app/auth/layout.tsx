import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Routes } from '@/lib/routes';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Redirect authenticated users to home
  if (userId) {
    redirect(Routes.HOME);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
