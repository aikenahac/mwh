import { Footer } from '@/components/home/footer';
import { NavbarWrapper } from '@/components/home/navbar-wrapper';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-screen max-w-screen flex flex-col">
      <div className="flex-1 flex items-start justify-center py-12 overflow-x-hidden">
        <div className="w-[90vw]">
          <header className="flex justify-end items-center gap-4 h-16 mb-8">
            <NavbarWrapper />
          </header>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
