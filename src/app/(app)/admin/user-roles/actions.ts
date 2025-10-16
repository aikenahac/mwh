'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userRole } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';

export async function addUserRole(userId: string, role: 'superadmin') {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isSuperAdmin(currentUserId);

  if (!isAdmin) {
    throw new Error('Forbidden: Only superadmins can add user roles');
  }

  // Verify the user exists in Clerk
  const client = await clerkClient();
  try {
    await client.users.getUser(userId);
  } catch {
    throw new Error('User not found in Clerk. Please verify the user ID.');
  }

  // Check if user already has a role
  const existingRole = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  });

  if (existingRole) {
    throw new Error('User already has a role assigned');
  }

  // Insert the new role
  await db.insert(userRole).values({
    userId,
    role,
  });

  revalidatePath(Routes.ADMIN_USER_ROLES);
}

export async function updateUserRole(userId: string, role: 'superadmin') {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isSuperAdmin(currentUserId);

  if (!isAdmin) {
    throw new Error('Forbidden: Only superadmins can update user roles');
  }

  // Update the role
  await db.update(userRole).set({ role }).where(eq(userRole.userId, userId));

  revalidatePath(Routes.ADMIN_USER_ROLES);
}

export async function removeUserRole(userId: string) {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isSuperAdmin(currentUserId);

  if (!isAdmin) {
    throw new Error('Forbidden: Only superadmins can remove user roles');
  }

  // Prevent removing own role
  if (userId === currentUserId) {
    throw new Error('You cannot remove your own role');
  }

  // Delete the role
  await db.delete(userRole).where(eq(userRole.userId, userId));

  revalidatePath(Routes.ADMIN_USER_ROLES);
}
