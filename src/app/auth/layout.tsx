import { AuthNavbar } from '@/components/auth/navbar';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-screen max-w-screen flex items-center justify-center">
      <div className="flex flex-col gap-2 ">
        <header className="flex justify-end items-center gap-4 h-16 w-full">
          <AuthNavbar />
        </header>
        {children}
      </div>
    </div>
  );
}
