'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { deck, card } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { z } from 'zod';

const whiteCardSchema = z.object({
  text: z.string().min(1, 'Card text cannot be empty').max(1000, 'Card text too long'),
  pack: z.number().int(),
});

const blackCardSchema = z.object({
  text: z.string().min(1, 'Card text cannot be empty').max(1000, 'Card text too long'),
  pick: z.number().int().min(1).max(10),
  pack: z.number().int(),
});

const deckDataSchema = z.object({
  name: z.string().min(1, 'Deck name cannot be empty').max(255, 'Deck name too long'),
  white: z.array(whiteCardSchema),
  black: z.array(blackCardSchema),
});

export interface UploadProgress {
  totalDecks: number;
  processedDecks: number;
  currentDeck: string | null;
  totalCards: number;
  processedCards: number;
  skippedDecks: string[];
  skippedCards: number;
  errors: string[];
  status: 'processing' | 'completed' | 'error';
}

export async function uploadSystemDecks(
  jsonContent: string
): Promise<UploadProgress> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    throw new Error('Forbidden: Only superadmins can upload system decks');
  }

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(jsonContent);
  } catch {
    throw new Error('Invalid JSON file format');
  }

  // Validate the structure with Zod
  if (!Array.isArray(parsedContent)) {
    throw new Error('JSON must be an array of decks');
  }

  const decksArraySchema = z.array(deckDataSchema);
  const validationResult = decksArraySchema.safeParse(parsedContent);

  if (!validationResult.success) {
    const issues = validationResult.error.issues;
    if (issues.length > 0) {
      const firstIssue = issues[0];
      throw new Error(
        `Invalid deck data at ${firstIssue.path.join('.')}: ${firstIssue.message}`
      );
    }
    throw new Error('Invalid deck data format');
  }

  const decks = validationResult.data;

  const progress: UploadProgress = {
    totalDecks: decks.length,
    processedDecks: 0,
    currentDeck: null,
    totalCards: decks.reduce((sum, d) => sum + d.white.length + d.black.length, 0),
    processedCards: 0,
    skippedDecks: [],
    skippedCards: 0,
    errors: [],
    status: 'processing',
  };

  // Get existing system deck names
  const existingDecks = await db.query.deck.findMany({
    where: eq(deck.userId, 'system'),
    columns: { name: true },
  });
  const existingDeckNames = new Set(existingDecks.map(d => d.name));

  for (const deckData of decks) {
    progress.currentDeck = deckData.name;

    // Validate deck structure
    if (!deckData.name || !Array.isArray(deckData.white) || !Array.isArray(deckData.black)) {
      progress.errors.push(`Invalid deck structure: ${deckData.name || 'Unknown'}`);
      progress.processedDecks++;
      continue;
    }

    // Skip if deck already exists
    if (existingDeckNames.has(deckData.name)) {
      const skippedCardCount = deckData.white.length + deckData.black.length;
      progress.skippedDecks.push(deckData.name);
      progress.skippedCards += skippedCardCount;
      progress.processedDecks++;
      progress.processedCards += skippedCardCount;
      continue;
    }

    try {
      // Insert the deck
      const [newDeck] = await db
        .insert(deck)
        .values({
          name: deckData.name,
          description: 'Deck from the official Cards Against Humanity set',
          userId: 'system',
        })
        .returning();

      // Insert white cards in batches of 100
      const whiteCardBatches = [];
      for (let i = 0; i < deckData.white.length; i += 100) {
        whiteCardBatches.push(deckData.white.slice(i, i + 100));
      }

      for (const batch of whiteCardBatches) {
        await db.insert(card).values(
          batch.map((c) => ({
            text: c.text,
            type: 'white' as const,
            deckId: newDeck.id,
            userId: 'system',
          }))
        );
        progress.processedCards += batch.length;
      }

      // Insert black cards in batches of 100
      const blackCardBatches = [];
      for (let i = 0; i < deckData.black.length; i += 100) {
        blackCardBatches.push(deckData.black.slice(i, i + 100));
      }

      for (const batch of blackCardBatches) {
        await db.insert(card).values(
          batch.map((c) => ({
            text: c.text,
            type: 'black' as const,
            pick: c.pick,
            deckId: newDeck.id,
            userId: 'system',
          }))
        );
        progress.processedCards += batch.length;
      }

      progress.processedDecks++;
    } catch (error) {
      progress.errors.push(
        `Failed to import deck "${deckData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      progress.processedDecks++;
    }
  }

  progress.currentDeck = null;
  progress.status = progress.errors.length > 0 ? 'error' : 'completed';

  return progress;
}
