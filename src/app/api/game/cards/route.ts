/**
 * Game Cards API Route
 *
 * POST /api/game/cards
 * Fetches full card data for given card IDs.
 * Used to populate player hands from card ID arrays.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { card } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/game/types';
import type { Card } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardIds } = body;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Card IDs are required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Fetch cards from database
    const cards = await db.select().from(card).where(inArray(card.id, cardIds));

    // Maintain the order of cardIds
    const orderedCards = cardIds
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is Card => c !== undefined);

    return NextResponse.json<ApiResponse<Card[]>>({
      success: true,
      data: orderedCards,
    });
  } catch (error) {
    console.error('[game/cards] Error fetching cards:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Failed to fetch cards',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
