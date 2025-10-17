/**
 * Game History API Route
 *
 * GET /api/game/history?userId={userId}&page={page}&pageSize={pageSize}
 * Fetches paginated game history for a user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { completedGame, completedGamePlayer, completedGameDeck, deck } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ApiResponse, PaginatedGameHistory, GameHistoryItem } from '@/lib/game/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'User ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Get total count first
    const allPlayerGames = await db.query.completedGamePlayer.findMany({
      where: eq(completedGamePlayer.clerkUserId, userId),
    });

    const totalCount = allPlayerGames.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    console.log(`[game/history] User ${userId} has ${totalCount} games`);

    // Get games where user participated (with full data)
    const playerGames = await db.query.completedGamePlayer.findMany({
      where: eq(completedGamePlayer.clerkUserId, userId),
      with: {
        completedGame: {
          with: {
            decks: {
              with: {
                deck: true,
              },
            },
            players: true,
          },
        },
      },
      limit: pageSize,
      offset,
    });

    console.log(`[game/history] Found ${playerGames.length} games for page ${page}`);

    // Sort by completion date (most recent first)
    playerGames.sort((a, b) =>
      new Date(b.completedGame.completedAt).getTime() - new Date(a.completedGame.completedAt).getTime()
    );

    // Transform to GameHistoryItem format
    const items: GameHistoryItem[] = playerGames.map((playerGame) => {
      const game = playerGame.completedGame;
      const userPlayer = game.players.find((p) => p.clerkUserId === userId);
      const winner = game.players.find((p) => p.placement === 1);

      return {
        id: game.id,
        completedAt: game.completedAt,
        createdAt: game.createdAt,
        durationMinutes: game.durationMinutes,
        totalRoundsPlayed: game.totalRoundsPlayed,
        wasAbandoned: game.wasAbandoned,
        winnerNickname: winner?.nickname || null,
        playerCount: game.players.length,
        userPlacement: userPlayer?.placement || 999,
        userScore: userPlayer?.finalScore || 0,
        decks: game.decks.map((d) => ({
          id: d.deck.id,
          name: d.deck.name,
        })),
      };
    });

    const paginatedHistory: PaginatedGameHistory = {
      items,
      totalCount,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json<ApiResponse<PaginatedGameHistory>>({
      success: true,
      data: paginatedHistory,
    });
  } catch (error) {
    console.error('[game/history] Error fetching history:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Failed to fetch game history',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
