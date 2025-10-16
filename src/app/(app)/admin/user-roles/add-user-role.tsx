'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { addUserRole } from './actions';
import { useTransition, useState } from 'react';

export function AddUserRole() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'superadmin'>('superadmin');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    startTransition(async () => {
      try {
        await addUserRole(userId.trim(), role);
        setUserId('');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add user role');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add User Role</CardTitle>
        <CardDescription>
          Assign a role to a user by entering their Clerk user ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="user_xxxxxxxxxxxxxxxxxxxxx"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: 'superadmin') => setRole(value)}
                disabled={isPending}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  {/* Add more roles here as they are added to the enum */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isPending}>
            <UserPlus className="mr-2 h-4 w-4" />
            {isPending ? 'Adding...' : 'Add User Role'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
