/**
 * Game Archive Service
 *
 * Handles archiving completed games to history tables with full transaction support.
 * This ensures atomic data migration - all or nothing.
 *
 * Process:
 * 1. Fetch all game data from active tables
 * 2. Calculate statistics (duration, placements, etc.)
 * 3. Insert into history tables within transaction
 * 4. Update player statistics
 * 5. Delete active game data
 *
 * If any step fails, entire transaction is rolled back.
 */

import { db } from '@/lib/db';
import {
  gameSession,
  player,
  round,
  submission,
  gameSessionDeck,
  completedGame,
  completedGameDeck,
  completedGamePlayer,
  completedRound,
  playerStatistic,
  card,
  type GameSession,
  type Player,
  type Round,
  type Submission,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { GameEndData, GameSettings } from './types';
import { GameError, GameErrorCode } from './types';

/**
 * Archive a completed game
 * Uses PostgreSQL transaction to ensure atomicity
 */
export async function archiveCompletedGame(sessionId: string): Promise<GameEndData> {
  return await db.transaction(async (tx) => {
    // 1. Fetch all game data
    const session = await tx.query.gameSession.findFirst({
      where: eq(gameSession.id, sessionId),
      with: {
        players: true,
        decks: true,
        rounds: {
          with: {
            submissions: true,
            blackCard: true,
          },
        },
      },
    });

    if (!session) {
      throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game session not found');
    }

    // 2. Calculate game statistics
    const now = new Date();
    const durationMinutes = Math.floor(
      (now.getTime() - session.createdAt.getTime()) / (1000 * 60),
    );

    // Sort players by score (descending)
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    // Calculate placements (handle ties)
    const placements = calculatePlacements(sortedPlayers);

    // 3. Create completed_game record
    const [completedGameRecord] = await tx
      .insert(completedGame)
      .values({
        sessionId: session.id,
        ownerId: session.ownerId,
        winnerUserId: winner?.clerkUserId || null,
        completedAt: now,
        durationMinutes,
        totalRoundsPlayed: session.rounds.length,
        settings: session.settings,
        createdAt: session.createdAt,
        wasAbandoned: session.status === 'abandoned',
      })
      .returning();

    // 4. Archive deck selections
    if (session.decks.length > 0) {
      await tx.insert(completedGameDeck).values(
        session.decks.map((d) => ({
          completedGameId: completedGameRecord.id,
          deckId: d.deckId,
        })),
      );
    }

    // 5. Archive players with final scores and placements
    await tx.insert(completedGamePlayer).values(
      sortedPlayers.map((p) => ({
        completedGameId: completedGameRecord.id,
        clerkUserId: p.clerkUserId,
        nickname: p.nickname,
        finalScore: p.score,
        roundsWon: countRoundsWon(p.id, session.rounds),
        wasOwner: p.isOwner,
        placement: placements.get(p.id)!,
      })),
    );

    // 6. Archive all rounds with submissions
    for (const r of session.rounds) {
      // Get all submissions for this round
      const roundSubmissions = r.submissions.map((s) => {
        const submitter = session.players.find((p) => p.id === s.playerId);
        return {
          playerId: s.playerId,
          nickname: submitter?.nickname || 'Unknown',
          cardIds: s.cardIds as string[],
        };
      });

      // Get winning submission
      const winningSubmission = r.submissions.find(
        (s) => s.playerId === r.winnerPlayerId,
      );

      await tx.insert(completedRound).values({
        completedGameId: completedGameRecord.id,
        roundNumber: r.roundNumber,
        blackCardId: r.blackCardId,
        czarUserId: session.players.find((p) => p.id === r.czarPlayerId)?.clerkUserId || null,
        winnerUserId: session.players.find((p) => p.id === r.winnerPlayerId)?.clerkUserId || null,
        winningSubmission: (winningSubmission?.cardIds as string[]) || [],
        allSubmissions: roundSubmissions,
        completedAt: r.completedAt || now,
      });
    }

    // 7. Update player statistics for authenticated players
    for (const p of session.players) {
      if (p.clerkUserId) {
        await updatePlayerStatistics(tx, p.clerkUserId, {
          gamePlayed: true,
          gameWon: p.id === winner?.id,
          roundsWon: countRoundsWon(p.id, session.rounds),
          roundsPlayed: session.rounds.length,
          lastPlayedAt: now,
        });
      }
    }

    // 8. Clean up active game data (cascading deletes handle related tables)
    await tx.delete(gameSession).where(eq(gameSession.id, sessionId));

    // 9. Return game end data for clients
    return {
      completedGameId: completedGameRecord.id,
      finalScores: sortedPlayers.map((p) => ({
        playerId: p.id,
        nickname: p.nickname,
        score: p.score,
        placement: placements.get(p.id)!,
      })),
      winner: {
        playerId: winner.id,
        nickname: winner.nickname,
        score: winner.score,
      },
      duration: durationMinutes,
      totalRounds: session.rounds.length,
    };
  });
}

/**
 * Update player statistics
 * Called within transaction for each player
 */
async function updatePlayerStatistics(
  tx: any,
  userId: string,
  gameData: {
    gamePlayed: boolean;
    gameWon: boolean;
    roundsWon: number;
    roundsPlayed: number;
    lastPlayedAt: Date;
  },
): Promise<void> {
  // Check if player stats exist
  const existing = await tx.query.playerStatistic.findFirst({
    where: eq(playerStatistic.userId, userId),
  });

  if (existing) {
    // Update existing stats
    const newTotalGamesPlayed = existing.totalGamesPlayed + 1;
    const newTotalGamesWon = existing.totalGamesWon + (gameData.gameWon ? 1 : 0);
    const newWinRate = newTotalGamesWon / newTotalGamesPlayed;

    await tx
      .update(playerStatistic)
      .set({
        totalGamesPlayed: newTotalGamesPlayed,
        totalGamesWon: newTotalGamesWon,
        totalRoundsWon: existing.totalRoundsWon + gameData.roundsWon,
        totalRoundsPlayed: existing.totalRoundsPlayed + gameData.roundsPlayed,
        winRate: newWinRate,
        lastPlayedAt: gameData.lastPlayedAt,
        updatedAt: new Date(),
      })
      .where(eq(playerStatistic.userId, userId));
  } else {
    // Create new stats
    const winRate = gameData.gameWon ? 1.0 : 0.0;

    await tx.insert(playerStatistic).values({
      userId,
      totalGamesPlayed: 1,
      totalGamesWon: gameData.gameWon ? 1 : 0,
      totalRoundsWon: gameData.roundsWon,
      totalRoundsPlayed: gameData.roundsPlayed,
      winRate,
      favoriteWinningCards: [],
      lastPlayedAt: gameData.lastPlayedAt,
    });
  }
}

/**
 * Calculate player placements based on scores
 * Handles ties (players with same score get same placement)
 */
function calculatePlacements(sortedPlayers: Player[]): Map<string, number> {
  const placements = new Map<string, number>();
  let currentPlacement = 1;
  let previousScore = sortedPlayers[0]?.score ?? 0;

  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];

    // If score changed, update placement
    if (player.score < previousScore) {
      currentPlacement = i + 1;
    }

    placements.set(player.id, currentPlacement);
    previousScore = player.score;
  }

  return placements;
}

/**
 * Count how many rounds a player won
 */
function countRoundsWon(playerId: string, rounds: Round[]): number {
  return rounds.filter((r) => r.winnerPlayerId === playerId).length;
}

/**
 * Archive an abandoned game
 * Called when all players leave before game ends naturally
 */
export async function archiveAbandonedGame(sessionId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const session = await tx.query.gameSession.findFirst({
      where: eq(gameSession.id, sessionId),
      with: {
        players: true,
        decks: true,
        rounds: {
          with: {
            submissions: true,
          },
        },
      },
    });

    if (!session) {
      return; // Already deleted
    }

    const now = new Date();
    const durationMinutes = Math.floor(
      (now.getTime() - session.createdAt.getTime()) / (1000 * 60),
    );

    // Archive as abandoned (no winner)
    const [completedGameRecord] = await tx
      .insert(completedGame)
      .values({
        sessionId: session.id,
        ownerId: session.ownerId,
        winnerUserId: null,
        completedAt: now,
        durationMinutes,
        totalRoundsPlayed: session.rounds.length,
        settings: session.settings,
        createdAt: session.createdAt,
        wasAbandoned: true,
      })
      .returning();

    // Archive decks
    if (session.decks.length > 0) {
      await tx.insert(completedGameDeck).values(
        session.decks.map((d) => ({
          completedGameId: completedGameRecord.id,
          deckId: d.deckId,
        })),
      );
    }

    // Archive players (no placements for abandoned games)
    await tx.insert(completedGamePlayer).values(
      session.players.map((p) => ({
        completedGameId: completedGameRecord.id,
        clerkUserId: p.clerkUserId,
        nickname: p.nickname,
        finalScore: p.score,
        roundsWon: countRoundsWon(p.id, session.rounds),
        wasOwner: p.isOwner,
        placement: 999, // Indicate abandoned game
      })),
    );

    // Delete active game
    await tx.delete(gameSession).where(eq(gameSession.id, sessionId));
  });
}

/**
 * Check for abandoned games and archive them
 * Run this periodically (e.g., every 5 minutes) to clean up
 */
export async function cleanupAbandonedGames(): Promise<number> {
  // Find games with no connected players that are over 15 minutes old
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const sessions = await db.query.gameSession.findMany({
    where: sql`${gameSession.createdAt} < ${fifteenMinutesAgo}`,
    with: {
      players: true,
    },
  });

  let archivedCount = 0;

  for (const session of sessions) {
    const allDisconnected = session.players.every((p) => !p.isConnected);

    if (allDisconnected) {
      await archiveAbandonedGame(session.id);
      archivedCount++;
    }
  }

  return archivedCount;
}
