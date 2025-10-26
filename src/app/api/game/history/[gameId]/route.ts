/**
 * Game Details API Route
 *
 * GET /api/game/history/[gameId]?userId={userId}
 * Fetches detailed information about a completed game.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { completedGame, card } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type {
  ApiResponse,
  GameDetailsData,
  GameSettings,
} from '@/lib/game/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const { gameId } = await params;

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'User ID is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Fetch game with all related data
    const game = await db.query.completedGame.findFirst({
      where: eq(completedGame.id, gameId),
      with: {
        players: true,
        decks: {
          with: {
            deck: true,
          },
        },
        rounds: {
          orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
        },
      },
    });

    if (!game) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Game not found',
          code: 'GAME_NOT_FOUND',
        },
      });
    }

    // Verify user participated in this game
    const userParticipated = game.players.some((p) => p.clerkUserId === userId);
    if (!userParticipated) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          message: 'Unauthorized access to game',
          code: 'UNAUTHORIZED',
        },
      });
    }

    // Get winner
    const winner =
      game.players.find((p) => p.placement === 1) || game.players[0];

    // Fetch all card IDs needed for rounds
    const allCardIds = new Set<string>();
    for (const round of game.rounds) {
      allCardIds.add(round.blackCardId);
      if (round.winningSubmission) {
        (round.winningSubmission as string[]).forEach((id) =>
          allCardIds.add(id),
        );
      }
      if (round.allSubmissions) {
        (round.allSubmissions as Array<{ cardIds: string[] }>).forEach(
          (sub) => {
            sub.cardIds.forEach((id) => allCardIds.add(id));
          },
        );
      }
    }

    // Fetch all cards at once
    const cards = await db.query.card.findMany({
      where: inArray(card.id, Array.from(allCardIds)),
    });

    const cardMap = new Map(cards.map((c) => [c.id, c]));

    // Transform rounds data
    const roundsData = game.rounds.map((round) => {
      const blackCard = cardMap.get(round.blackCardId)!;
      const winningCards = ((round.winningSubmission as string[]) || [])
        .map((id) => cardMap.get(id))
        .filter((c) => c !== undefined);

      const allSubmissions = (
        (round.allSubmissions as Array<{
          playerId: string;
          nickname: string;
          cardIds: string[];
        }>) || []
      ).map((sub) => ({
        playerNickname: sub.nickname,
        cards: sub.cardIds
          .map((id) => cardMap.get(id))
          .filter((c) => c !== undefined),
      }));

      return {
        roundNumber: round.roundNumber,
        blackCard,
        czarNickname:
          game.players.find((p) => p.clerkUserId === round.czarUserId)
            ?.nickname || 'Unknown',
        winnerNickname:
          game.players.find((p) => p.clerkUserId === round.winnerUserId)
            ?.nickname || 'Unknown',
        winningSubmission: winningCards,
        allSubmissions,
        completedAt: round.completedAt,
      };
    });

    const gameDetails: GameDetailsData = {
      id: game.id,
      sessionId: game.sessionId,
      completedAt: game.completedAt,
      createdAt: game.createdAt,
      durationMinutes: game.durationMinutes,
      totalRoundsPlayed: game.totalRoundsPlayed,
      wasAbandoned: game.wasAbandoned,
      settings: game.settings as GameSettings,
      winner: {
        userId: winner.clerkUserId,
        nickname: winner.nickname,
        score: winner.finalScore,
      },
      players: game.players.map((p) => ({
        userId: p.clerkUserId,
        nickname: p.nickname,
        finalScore: p.finalScore,
        roundsWon: p.roundsWon,
        wasOwner: p.wasOwner,
        placement: p.placement,
      })),
      decks: game.decks.map((d) => ({
        id: d.deck.id,
        name: d.deck.name,
        description: d.deck.description,
      })),
      rounds: roundsData,
    };

    return NextResponse.json<ApiResponse<GameDetailsData>>({
      success: true,
      data: gameDetails,
    });
  } catch (error) {
    console.error(
      '[game/history/[gameId]] Error fetching game details:',
      error,
    );
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        message: 'Failed to fetch game details',
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
