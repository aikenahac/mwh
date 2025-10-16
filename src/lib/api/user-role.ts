import { z } from 'zod';
import { db } from '@/lib/db';
import { userRole } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const userRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['superadmin']),
  createdAt: z.date(),
});

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Get a user's role from the database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const result = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  });

  if (!result) {
    return null;
  }

  const parsed = userRoleSchema.safeParse(result);
  return parsed.success ? parsed.data : null;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, role: 'superadmin'): Promise<boolean> {
  const userRoleData = await getUserRole(userId);
  return userRoleData?.role === role;
}

/**
 * Get all users with roles
 */
export async function getAllUserRoles(): Promise<UserRole[]> {
  const roles = await db.query.userRole.findMany();
  const parsed = z.array(userRoleSchema).safeParse(roles);
  return parsed.success ? parsed.data : [];
}
