import { auth } from '@clerk/nextjs/server';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Navbar } from './navbar';

export async function NavbarWrapper() {
  const { userId } = await auth();

  let isAdmin = false;
  if (userId) {
    isAdmin = await isSuperAdmin(userId);
  }

  return <Navbar isAdmin={isAdmin} />;
}
