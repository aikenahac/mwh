import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';
import { Database, Users } from 'lucide-react';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect(Routes.SIGN_IN);
  }

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    redirect(Routes.HOME);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage system resources and user roles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={Routes.ADMIN_SYSTEM_DECKS}>
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>System Decks</CardTitle>
                  <CardDescription>
                    Manage system-wide card decks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and delete system decks and their cards. System decks are
                available to all users.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={Routes.ADMIN_USER_ROLES}>
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>User Roles</CardTitle>
                  <CardDescription>
                    Manage user roles and permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all users with assigned roles, edit roles, add new users,
                and remove users from the roles table.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
