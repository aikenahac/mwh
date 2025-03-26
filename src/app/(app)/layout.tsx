import { Navbar } from '@/components/home/navbar';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="min-h-screen w-screen max-w-screen flex items-start justify-center py-12">
      <div className='w-[75vw]'>
        <header className="flex justify-end items-center gap-4 h-16 mb-8">
          <Navbar />
        </header>
        {children}
      </div>
    </div>
  );
}
