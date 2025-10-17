/**
 * Game History Service
 *
 * Handles querying game history, player statistics, and leaderboards.
 * All queries are optimized with proper indexing and pagination.
 */

import { db } from '@/lib/db';
import {
  completedGame,
  completedGamePlayer,
  completedGameDeck,
  playerStatistic,
  deck,
} from '@/lib/db/schema';
import { eq, desc, asc, and, gte, lte, or, sql } from 'drizzle-orm';
import type {
  GameHistoryItem,
  PaginatedGameHistory,
  GameDetailsData,
  GameSettings,
  UserStatistics,
  LeaderboardData,
  LeaderboardMetric,
  GameHistoryFilters,
  GameHistorySortOption,
} from './types';
import { GameError, GameErrorCode } from './types';

// ============================================
// GAME HISTORY QUERIES
// ============================================

/**
 * Get user's game history with pagination and filters
 */
export async function getUserGameHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: GameHistoryFilters,
  sort?: GameHistorySortOption,
): Promise<PaginatedGameHistory> {
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(completedGamePlayer.clerkUserId, userId)];

  if (filters?.wonOnly) {
    conditions.push(eq(completedGame.winnerUserId, userId));
  }

  if (filters?.dateFrom) {
    conditions.push(gte(completedGame.completedAt, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(completedGame.completedAt, filters.dateTo));
  }

  // Query completed game players with game data
  const gamesQuery = db
    .select({
      game: completedGame,
      player: completedGamePlayer,
    })
    .from(completedGamePlayer)
    .innerJoin(completedGame, eq(completedGamePlayer.completedGameId, completedGame.id))
    .where(and(...conditions))
    .orderBy(
      sort?.direction === 'asc'
        ? asc(completedGame[sort.field])
        : desc(completedGame[sort?.field || 'completedAt']),
    )
    .limit(pageSize)
    .offset(offset);

  const gamesData = await gamesQuery;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(completedGamePlayer)
    .innerJoin(completedGame, eq(completedGamePlayer.completedGameId, completedGame.id))
    .where(and(...conditions));

  const totalCount = countResult[0]?.count || 0;

  // Get decks for each game
  const gameIds = gamesData.map((g) => g.game.id);
  const decksData = await db
    .select({
      gameId: completedGameDeck.completedGameId,
      deck: deck,
    })
    .from(completedGameDeck)
    .innerJoin(deck, eq(completedGameDeck.deckId, deck.id))
    .where((completedGameDeck, { inArray }) => inArray(completedGameDeck.completedGameId, gameIds));

  // Group decks by game
  const decksByGame = new Map<string, typeof deck.$inferSelect[]>();
  for (const d of decksData) {
    if (!decksByGame.has(d.gameId)) {
      decksByGame.set(d.gameId, []);
    }
    decksByGame.get(d.gameId)!.push(d.deck);
  }

  // Get winner nicknames
  const winnerIds = [...new Set(gamesData.map((g) => g.game.winnerUserId).filter(Boolean))];
  const winnersData = await db
    .select({
      gameId: completedGamePlayer.completedGameId,
      nickname: completedGamePlayer.nickname,
      userId: completedGamePlayer.clerkUserId,
    })
    .from(completedGamePlayer)
    .where((completedGamePlayer, { inArray }) =>
      and(
        inArray(completedGamePlayer.completedGameId, gameIds),
        or(
          ...winnerIds.map((wId) => eq(completedGamePlayer.clerkUserId, wId)),
        ),
      ),
    );

  const winnerNicknames = new Map<string, string>();
  for (const w of winnersData) {
    if (w.userId) {
      winnerNicknames.set(`${w.gameId}_${w.userId}`, w.nickname);
    }
  }

  // Get player counts
  const playerCounts = await db
    .select({
      gameId: completedGamePlayer.completedGameId,
      count: sql<number>`count(*)`,
    })
    .from(completedGamePlayer)
    .where((completedGamePlayer, { inArray }) =>
      inArray(completedGamePlayer.completedGameId, gameIds),
    )
    .groupBy(completedGamePlayer.completedGameId);

  const playerCountMap = new Map(playerCounts.map((pc) => [pc.gameId, pc.count]));

  // Build history items
  const items: GameHistoryItem[] = gamesData.map(({ game, player }) => ({
    id: game.id,
    completedAt: game.completedAt,
    createdAt: game.createdAt,
    durationMinutes: game.durationMinutes,
    totalRoundsPlayed: game.totalRoundsPlayed,
    wasAbandoned: game.wasAbandoned,
    winnerNickname: game.winnerUserId
      ? winnerNicknames.get(`${game.id}_${game.winnerUserId}`) || 'Unknown'
      : null,
    playerCount: playerCountMap.get(game.id) || 0,
    userPlacement: player.placement,
    userScore: player.finalScore,
    decks: (decksByGame.get(game.id) || []).map((d) => ({
      id: d.id,
      name: d.name,
    })),
  }));

  // Apply player count filter if specified
  let filteredItems = items;
  if (filters?.minPlayers) {
    filteredItems = filteredItems.filter((item) => item.playerCount >= filters.minPlayers!);
  }
  if (filters?.maxPlayers) {
    filteredItems = filteredItems.filter((item) => item.playerCount <= filters.maxPlayers!);
  }

  return {
    items: filteredItems,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Get full game details for replay
 */
export async function getGameDetails(
  gameId: string,
  requestingUserId: string,
): Promise<GameDetailsData> {
  // Verify user participated in this game
  const participation = await db.query.completedGamePlayer.findFirst({
    where: and(
      eq(completedGamePlayer.completedGameId, gameId),
      eq(completedGamePlayer.clerkUserId, requestingUserId),
    ),
  });

  if (!participation) {
    throw new GameError(
      GameErrorCode.UNAUTHORIZED,
      'You can only view games you participated in',
    );
  }

  // Get game data
  const game = await db.query.completedGame.findFirst({
    where: eq(completedGame.id, gameId),
    with: {
      players: true,
      decks: {
        with: {
          deck: true,
        },
      },
      rounds: true,
    },
  });

  if (!game) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  // Get winner info
  const winner = game.players.find((p) => p.clerkUserId === game.winnerUserId);

  // Get all cards used in rounds
  const allCardIds = new Set<string>();
  for (const round of game.rounds) {
    allCardIds.add(round.blackCardId);
    for (const cardId of round.winningSubmission as string[]) {
      allCardIds.add(cardId);
    }
    for (const sub of round.allSubmissions as Array<{ playerId: string; nickname: string; cardIds: string[] }>) {
      for (const cardId of sub.cardIds) {
        allCardIds.add(cardId);
      }
    }
  }

  const allCards = await db.query.card.findMany({
    where: (card, { inArray }) => inArray(card.id, Array.from(allCardIds)),
  });

  const cardMap = new Map(allCards.map((c) => [c.id, c]));

  // Build rounds with full card data
  const roundsData = game.rounds.map((round) => {
    const blackCard = cardMap.get(round.blackCardId)!;
    const winningCards = (round.winningSubmission as string[]).map((id) => cardMap.get(id)!);

    const allSubmissions = (
      round.allSubmissions as Array<{ playerId: string; nickname: string; cardIds: string[] }>
    ).map((sub) => ({
      playerNickname: sub.nickname,
      cards: sub.cardIds.map((id) => cardMap.get(id)!).filter(Boolean),
    }));

    return {
      roundNumber: round.roundNumber,
      blackCard,
      czarNickname: game.players.find((p) => p.clerkUserId === round.czarUserId)?.nickname || 'Unknown',
      winnerNickname: game.players.find((p) => p.clerkUserId === round.winnerUserId)?.nickname || 'Unknown',
      winningSubmission: winningCards,
      allSubmissions,
      completedAt: round.completedAt,
    };
  });

  return {
    id: game.id,
    sessionId: game.sessionId,
    completedAt: game.completedAt,
    createdAt: game.createdAt,
    durationMinutes: game.durationMinutes,
    totalRoundsPlayed: game.totalRoundsPlayed,
    wasAbandoned: game.wasAbandoned,
    settings: game.settings as GameSettings,
    winner: {
      userId: game.winnerUserId,
      nickname: winner?.nickname || 'Unknown',
      score: winner?.finalScore || 0,
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
}

// ============================================
// PLAYER STATISTICS
// ============================================

/**
 * Get user's aggregate statistics
 */
export async function getUserStatistics(userId: string): Promise<UserStatistics> {
  const stats = await db.query.playerStatistic.findFirst({
    where: eq(playerStatistic.userId, userId),
  });

  if (!stats) {
    // Return empty stats for new players
    return {
      userId,
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalRoundsWon: 0,
      totalRoundsPlayed: 0,
      winRate: 0,
      favoriteWinningCards: [],
      lastPlayedAt: null,
    };
  }

  // Get favorite winning cards
  const favoriteCardIds = (stats.favoriteWinningCards as Array<{ cardId: string; winCount: number }>)
    .slice(0, 5)
    .map((f) => f.cardId);

  const favoriteCards = await db.query.card.findMany({
    where: (card, { inArray }) => inArray(card.id, favoriteCardIds),
  });

  const cardMap = new Map(favoriteCards.map((c) => [c.id, c]));

  const favoriteWinningCards = (stats.favoriteWinningCards as Array<{ cardId: string; winCount: number }>)
    .slice(0, 5)
    .map((f) => ({
      card: cardMap.get(f.cardId)!,
      winCount: f.winCount,
    }))
    .filter((f) => f.card);

  return {
    userId: stats.userId,
    totalGamesPlayed: stats.totalGamesPlayed,
    totalGamesWon: stats.totalGamesWon,
    totalRoundsWon: stats.totalRoundsWon,
    totalRoundsPlayed: stats.totalRoundsPlayed,
    winRate: stats.winRate,
    favoriteWinningCards,
    lastPlayedAt: stats.lastPlayedAt,
  };
}

// ============================================
// LEADERBOARDS
// ============================================

/**
 * Get global leaderboard
 */
export async function getLeaderboard(
  metric: LeaderboardMetric,
  limit: number = 50,
  currentUserId?: string,
): Promise<LeaderboardData> {
  // Determine order by field
  let orderByField: typeof playerStatistic.totalGamesWon;
  switch (metric) {
    case 'wins':
      orderByField = playerStatistic.totalGamesWon;
      break;
    case 'win_rate':
      orderByField = playerStatistic.winRate;
      break;
    case 'rounds_won':
      orderByField = playerStatistic.totalRoundsWon;
      break;
  }

  // Query top players
  const topPlayers = await db
    .select()
    .from(playerStatistic)
    .orderBy(desc(orderByField))
    .limit(limit);

  // Get nicknames from recent games
  const userIds = topPlayers.map((p) => p.userId);
  const recentPlayers = await db
    .select({
      userId: completedGamePlayer.clerkUserId,
      nickname: completedGamePlayer.nickname,
    })
    .from(completedGamePlayer)
    .where((completedGamePlayer, { inArray }) =>
      inArray(completedGamePlayer.clerkUserId, userIds as string[]),
    )
    .orderBy(desc(completedGamePlayer.completedGameId));

  // Get most recent nickname for each user
  const nicknameMap = new Map<string, string>();
  for (const p of recentPlayers) {
    if (p.userId && !nicknameMap.has(p.userId)) {
      nicknameMap.set(p.userId, p.nickname);
    }
  }

  // Build leaderboard entries
  const entries = topPlayers.map((p, index) => ({
    userId: p.userId,
    nickname: nicknameMap.get(p.userId),
    rank: index + 1,
    totalGamesWon: p.totalGamesWon,
    totalGamesPlayed: p.totalGamesPlayed,
    winRate: p.winRate,
    totalRoundsWon: p.totalRoundsWon,
    lastPlayedAt: p.lastPlayedAt!,
  }));

  // Get current user's rank if provided
  let currentUserRank: number | undefined;
  if (currentUserId) {
    const userStats = await db.query.playerStatistic.findFirst({
      where: eq(playerStatistic.userId, currentUserId),
    });

    if (userStats) {
      // Count how many players have better stats
      const betterPlayers = await db
        .select({ count: sql<number>`count(*)` })
        .from(playerStatistic)
        .where(sql`${orderByField} > ${userStats[orderByField.name as keyof typeof userStats]}`);

      currentUserRank = (betterPlayers[0]?.count || 0) + 1;
    }
  }

  // Get total player count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(playerStatistic);

  const totalPlayers = totalResult[0]?.count || 0;

  return {
    metric,
    entries,
    currentUserRank,
    totalPlayers,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get quick stats for a user (for profile display)
 */
export async function getQuickStats(userId: string): Promise<{
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  lastPlayed: Date | null;
}> {
  const stats = await db.query.playerStatistic.findFirst({
    where: eq(playerStatistic.userId, userId),
  });

  if (!stats) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      lastPlayed: null,
    };
  }

  return {
    gamesPlayed: stats.totalGamesPlayed,
    gamesWon: stats.totalGamesWon,
    winRate: stats.winRate,
    lastPlayed: stats.lastPlayedAt,
  };
}

/**
 * Check if user participated in a game (for access control)
 */
export async function didUserParticipate(gameId: string, userId: string): Promise<boolean> {
  const participation = await db.query.completedGamePlayer.findFirst({
    where: and(
      eq(completedGamePlayer.completedGameId, gameId),
      eq(completedGamePlayer.clerkUserId, userId),
    ),
  });

  return !!participation;
}
