/**
 * Available Decks API Route
 *
 * Returns system decks and user's accessible decks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableDecksForUser } from '@/lib/game/deck-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'User ID required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  try {
    const decks = await getAvailableDecksForUser(userId);

    return NextResponse.json({
      success: true,
      data: decks,
    });
  } catch (error) {
    console.error('[API] Error fetching decks:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch decks',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
