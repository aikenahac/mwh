import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';
import { getAllUserRoles } from '@/lib/api/user-role';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AddUserRole } from './add-user-role';
import { AllUsersTable } from './all-users-table';

export default async function UserRolesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect(Routes.SIGN_IN);
  }

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    redirect(Routes.HOME);
  }

  // Fetch all user roles
  const userRoles = await getAllUserRoles();

  // Fetch all users from Clerk
  const client = await clerkClient();
  const allUsersResponse = await client.users.getUserList({ limit: 100 });
  const allUsers = allUsersResponse.data
    .map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || 'No email',
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      role: userRoles.find((ur) => ur.userId === user.id)?.role || null,
    }))
    // Sort users with roles to the top
    .sort((a, b) => {
      if (a.role && !b.role) return -1;
      if (!a.role && b.role) return 1;
      return 0;
    });

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link
          href={Routes.ADMIN}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Link>
        <h1 className="text-3xl font-bold mb-2">User Roles</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions. Add, edit, or remove user roles.
        </p>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">All Users</h2>
          <p className="text-sm text-muted-foreground">
            {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} in the system
          </p>
        </div>
        <AllUsersTable users={allUsers} />
      </div>
    </div>
  );
}
