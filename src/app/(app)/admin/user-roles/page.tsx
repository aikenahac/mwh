import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';
import { getAllUserRoles } from '@/lib/api/user-role';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AddUserRole } from './add-user-role';
import { UserRolesTable } from './user-roles-table';

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

  // Fetch user data from Clerk for each user with a role
  const client = await clerkClient();
  const usersData = await Promise.all(
    userRoles.map(async (userRole) => {
      try {
        const user = await client.users.getUser(userRole.userId);
        return {
          ...userRole,
          clerkUser: {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || 'No email',
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
        };
      } catch (error) {
        // User might have been deleted from Clerk
        return {
          ...userRole,
          clerkUser: {
            id: userRole.userId,
            email: 'User not found in Clerk',
            username: null,
            firstName: null,
            lastName: null,
            imageUrl: null,
          },
        };
      }
    })
  );

  return (
    <div className="container mx-auto py-8">
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

      <div className="mb-6">
        <AddUserRole />
      </div>

      {usersData.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No users with roles found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Users with Roles</h2>
            <p className="text-sm text-muted-foreground">
              {usersData.length} user{usersData.length !== 1 ? 's' : ''} with assigned
              roles
            </p>
          </div>
          <UserRolesTable users={usersData} />
        </div>
      )}
    </div>
  );
}
