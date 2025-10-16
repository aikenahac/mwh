import { z } from 'zod';

export const createDeckFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
});

export const shareDeckSchema = z.object({
  deckId: z.string().uuid({ message: 'Invalid deck ID' }),
  username: z.string().min(1, { message: 'Username is required' }),
  permission: z.enum(['view', 'collaborate'], { message: 'Permission must be either view or collaborate' }),
});

export const updateSharePermissionSchema = z.object({
  shareId: z.string().uuid({ message: 'Invalid share ID' }),
  permission: z.enum(['view', 'collaborate'], { message: 'Permission must be either view or collaborate' }),
});

export const removeShareSchema = z.object({
  shareId: z.string().uuid({ message: 'Invalid share ID' }),
});
