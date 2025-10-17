/**
 * Game Service
 *
 * Core game logic for Cards Against Humanity multiplayer gameplay.
 * Handles:
 * - Game session creation and management
 * - Player join/leave
 * - Deck selection and card dealing
 * - Round management
 * - Winner selection
 * - Game end logic
 *
 * All functions are designed to be called from Socket.io event handlers.
 */

import { db } from '@/lib/db';
import {
  gameSession,
  gameSessionDeck,
  player,
  round,
  submission,
  card,
  type Player,
  type Round,
  type Card,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { aggregateCardPool, validateCardPool } from './deck-service';
import type {
  GameSettings,
  PlayerData,
  GameSessionData,
  GameStatus,
} from './types';
import { GameError, GameErrorCode, DEFAULT_GAME_SETTINGS } from './types';

// ============================================
// GAME SESSION MANAGEMENT
// ============================================

/**
 * Create a new game session (lobby)
 */
export async function createGameSession(
  ownerId: string,
  ownerNickname: string,
  settings: GameSettings = DEFAULT_GAME_SETTINGS as GameSettings,
): Promise<{ sessionId: string; joinCode: string }> {
  // Generate unique join code
  const joinCode = generateJoinCode();

  // Check if join code already exists (unlikely but possible)
  const existing = await db.query.gameSession.findFirst({
    where: eq(gameSession.joinCode, joinCode),
  });

  if (existing) {
    // Recursive retry with new code
    return createGameSession(ownerId, ownerNickname, settings);
  }

  // Create game session
  const [session] = await db
    .insert(gameSession)
    .values({
      ownerId,
      status: 'lobby',
      currentRound: 0,
      settings,
      joinCode,
    })
    .returning();

  // Add owner as first player
  await db.insert(player).values({
    sessionId: session.id,
    clerkUserId: ownerId,
    nickname: ownerNickname,
    score: 0,
    hand: [],
    isCardCzar: false,
    isOwner: true,
    isConnected: true,
  });

  return {
    sessionId: session.id,
    joinCode: session.joinCode,
  };
}

/**
 * Join an existing game session
 */
export async function joinGameSession(
  joinCode: string,
  userId: string | null,
  nickname: string,
): Promise<GameSessionData> {
  // Find session by join code
  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.joinCode, joinCode),
    with: {
      players: true,
      decks: true,
    },
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found with that join code');
  }

  if (session.status !== 'lobby') {
    throw new GameError(GameErrorCode.GAME_ALREADY_STARTED, 'Game has already started');
  }

  // Check if player limit reached (max 20 players)
  if (session.players.length >= 20) {
    throw new GameError(GameErrorCode.GAME_FULL, 'Game is full (20 players max)');
  }

  // Check if user already in game
  const existingPlayer = session.players.find(p => p.clerkUserId === userId && userId !== null);
  if (existingPlayer) {
    throw new GameError(GameErrorCode.VALIDATION_ERROR, 'You are already in this game');
  }

  // Add player
  await db.insert(player).values({
    sessionId: session.id,
    clerkUserId: userId,
    nickname,
    score: 0,
    hand: [],
    isCardCzar: false,
    isOwner: false,
    isConnected: true,
  });

  return await getGameSessionData(session.id);
}

/**
 * Leave a game session
 */
export async function leaveGameSession(sessionId: string, playerId: string): Promise<void> {
  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
    with: { players: true },
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  const leavingPlayer = session.players.find(p => p.id === playerId);
  if (!leavingPlayer) {
    throw new GameError(GameErrorCode.NOT_IN_GAME, 'Player not in game');
  }

  // Remove player
  await db.delete(player).where(eq(player.id, playerId));

  // If owner left, transfer ownership or end game
  if (leavingPlayer.isOwner) {
    const remainingPlayers = session.players.filter(p => p.id !== playerId);
    if (remainingPlayers.length > 0) {
      // Transfer ownership to next player
      const newOwner = remainingPlayers[0];
      await db.update(player).set({ isOwner: true }).where(eq(player.id, newOwner.id));
    } else {
      // No players left, delete session
      await db.delete(gameSession).where(eq(gameSession.id, sessionId));
    }
  }
}

/**
 * Update selected decks (owner only)
 */
export async function updateSessionDecks(
  sessionId: string,
  deckIds: string[],
  requestingUserId: string,
): Promise<void> {
  await validateOwnership(sessionId, requestingUserId);

  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  if (session.status !== 'lobby') {
    throw new GameError(GameErrorCode.GAME_NOT_IN_LOBBY, 'Cannot change decks after game started');
  }

  // Remove existing deck selections
  await db.delete(gameSessionDeck).where(eq(gameSessionDeck.sessionId, sessionId));

  // Add new deck selections
  if (deckIds.length > 0) {
    await db.insert(gameSessionDeck).values(
      deckIds.map(deckId => ({
        sessionId,
        deckId,
      })),
    );
  }
}

/**
 * Update game settings (owner only)
 */
export async function updateGameSettings(
  sessionId: string,
  settings: GameSettings,
  requestingUserId: string,
): Promise<void> {
  await validateOwnership(sessionId, requestingUserId);

  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  if (session.status !== 'lobby') {
    throw new GameError(GameErrorCode.GAME_NOT_IN_LOBBY, 'Cannot change settings after game started');
  }

  await db.update(gameSession).set({ settings }).where(eq(gameSession.id, sessionId));
}

/**
 * Start the game (owner only)
 */
export async function startGame(
  sessionId: string,
  requestingUserId: string,
): Promise<{ blackCards: Card[]; whiteCards: Card[] }> {
  await validateOwnership(sessionId, requestingUserId);

  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
    with: {
      players: true,
      decks: true,
    },
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  if (session.status !== 'lobby') {
    throw new GameError(GameErrorCode.GAME_ALREADY_STARTED, 'Game has already started');
  }

  if (session.players.length < 3) {
    throw new GameError(GameErrorCode.VALIDATION_ERROR, 'Need at least 3 players to start');
  }

  if (session.decks.length === 0) {
    throw new GameError(GameErrorCode.NO_DECKS_SELECTED, 'Must select at least one deck');
  }

  // Validate card pool
  const deckIds = session.decks.map(d => d.deckId);
  const validation = await validateCardPool(
    deckIds,
    session.players.length,
    session.settings.handSize,
  );

  if (!validation.valid) {
    throw new GameError(GameErrorCode.NOT_ENOUGH_CARDS, validation.error!);
  }

  // Get aggregated card pool
  const { blackCards, whiteCards } = await aggregateCardPool(deckIds);

  // Update game status
  await db.update(gameSession).set({ status: 'playing', currentRound: 1 }).where(eq(gameSession.id, sessionId));

  // Deal initial hands to all players
  await dealInitialHands(sessionId, whiteCards, session.settings.handSize);

  return { blackCards, whiteCards };
}

// ============================================
// ROUND MANAGEMENT
// ============================================

/**
 * Start a new round
 */
export async function startRound(
  sessionId: string,
  roundNumber: number,
  blackCardId: string,
  czarPlayerId: string,
): Promise<Round> {
  // Set czar flag
  await db.update(player).set({ isCardCzar: false }).where(eq(player.sessionId, sessionId));
  await db.update(player).set({ isCardCzar: true }).where(eq(player.id, czarPlayerId));

  // Create round
  const [newRound] = await db
    .insert(round)
    .values({
      sessionId,
      roundNumber,
      blackCardId,
      czarPlayerId,
      status: 'playing',
    })
    .returning();

  return newRound;
}

/**
 * Submit cards for a round
 */
export async function submitCards(
  roundId: string,
  playerId: string,
  cardIds: string[],
): Promise<void> {
  const currentRound = await db.query.round.findFirst({
    where: eq(round.id, roundId),
    with: {
      submissions: true,
    },
  });

  if (!currentRound) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Round not found');
  }

  if (currentRound.status !== 'playing') {
    throw new GameError(GameErrorCode.VALIDATION_ERROR, 'Round is not accepting submissions');
  }

  // Check if player is czar
  if (currentRound.czarPlayerId === playerId) {
    throw new GameError(GameErrorCode.VALIDATION_ERROR, 'Card Czar cannot submit cards');
  }

  // Check if already submitted
  const existingSubmission = currentRound.submissions.find(s => s.playerId === playerId);
  if (existingSubmission) {
    throw new GameError(GameErrorCode.ALREADY_SUBMITTED, 'You have already submitted cards');
  }

  // Get black card to check pick count
  const blackCard = await db.query.card.findFirst({
    where: eq(card.id, currentRound.blackCardId),
  });

  if (!blackCard) {
    throw new GameError(GameErrorCode.INTERNAL_ERROR, 'Black card not found');
  }

  // Validate card count matches pick requirement
  if (cardIds.length !== blackCard.pick) {
    throw new GameError(
      GameErrorCode.WRONG_NUMBER_OF_CARDS,
      `Must submit exactly ${blackCard.pick} card(s)`,
    );
  }

  // Validate cards are in player's hand
  const playerData = await db.query.player.findFirst({
    where: eq(player.id, playerId),
  });

  if (!playerData) {
    throw new GameError(GameErrorCode.NOT_IN_GAME, 'Player not found');
  }

  const hand = playerData.hand as string[];
  const allCardsInHand = cardIds.every(cardId => hand.includes(cardId));

  if (!allCardsInHand) {
    throw new GameError(GameErrorCode.CARDS_NOT_IN_HAND, 'Some cards are not in your hand');
  }

  // Create submission
  await db.insert(submission).values({
    roundId,
    playerId,
    cardIds,
  });

  // Remove submitted cards from hand
  const newHand = hand.filter(cardId => !cardIds.includes(cardId));
  await db.update(player).set({ hand: newHand }).where(eq(player.id, playerId));
}

/**
 * Select winner for a round (czar only)
 */
export async function selectWinner(
  roundId: string,
  submissionId: string,
  czarPlayerId: string,
): Promise<{ winnerId: string; winnerScore: number }> {
  const currentRound = await db.query.round.findFirst({
    where: eq(round.id, roundId),
    with: {
      submissions: true,
      session: true,
    },
  });

  if (!currentRound) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Round not found');
  }

  if (currentRound.czarPlayerId !== czarPlayerId) {
    throw new GameError(GameErrorCode.NOT_CZAR, 'Only the Card Czar can select winner');
  }

  if (currentRound.status !== 'playing') {
    throw new GameError(GameErrorCode.VALIDATION_ERROR, 'Round is not in playing state');
  }

  const winningSubmission = currentRound.submissions.find(s => s.id === submissionId);
  if (!winningSubmission) {
    throw new GameError(GameErrorCode.INVALID_WINNER_SELECTION, 'Submission not found');
  }

  // Update round with winner
  await db
    .update(round)
    .set({
      winnerPlayerId: winningSubmission.playerId,
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(round.id, roundId));

  // Award point to winner
  const winner = await db.query.player.findFirst({
    where: eq(player.id, winningSubmission.playerId),
  });

  if (!winner) {
    throw new GameError(GameErrorCode.INTERNAL_ERROR, 'Winner player not found');
  }

  const newScore = winner.score + 1;
  await db.update(player).set({ score: newScore }).where(eq(player.id, winner.id));

  return {
    winnerId: winner.id,
    winnerScore: newScore,
  };
}

/**
 * Deal replacement cards after round ends
 */
export async function dealReplacementCards(
  sessionId: string,
  whiteCards: Card[],
  handSize: number,
): Promise<{ updatedPlayers: Player[]; remainingCards: Card[] }> {
  const players = await db.query.player.findMany({
    where: eq(player.sessionId, sessionId),
  });

  let cardIndex = 0;
  const updatedPlayers: Player[] = [];

  for (const p of players) {
    const hand = p.hand as string[];
    const cardsNeeded = handSize - hand.length;

    if (cardsNeeded > 0 && cardIndex < whiteCards.length) {
      const newCards = whiteCards.slice(cardIndex, cardIndex + cardsNeeded).map(c => c.id);
      cardIndex += cardsNeeded;

      const newHand = [...hand, ...newCards];
      await db.update(player).set({ hand: newHand }).where(eq(player.id, p.id));

      updatedPlayers.push({ ...p, hand: newHand });
    } else {
      updatedPlayers.push(p);
    }
  }

  const remainingCards = whiteCards.slice(cardIndex);

  return { updatedPlayers, remainingCards };
}

/**
 * Check if game should end (someone reached point goal)
 */
export async function checkGameEnd(sessionId: string): Promise<{
  shouldEnd: boolean;
  winner?: Player;
}> {
  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
    with: { players: true },
  });

  if (!session) {
    return { shouldEnd: false };
  }

  const pointsToWin = session.settings.pointsToWin;
  const winner = session.players.find(p => p.score >= pointsToWin);

  if (winner) {
    // Update session status
    await db.update(gameSession).set({ status: 'ended' }).where(eq(gameSession.id, sessionId));
    return { shouldEnd: true, winner };
  }

  return { shouldEnd: false };
}

/**
 * Get next Card Czar (rotate through players)
 */
export async function getNextCzar(sessionId: string, currentCzarId: string): Promise<Player> {
  const players = await db.query.player.findMany({
    where: eq(player.sessionId, sessionId),
    orderBy: player.joinedAt,
  });

  const currentIndex = players.findIndex(p => p.id === currentCzarId);
  const nextIndex = (currentIndex + 1) % players.length;

  return players[nextIndex];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Deal initial hands to all players
 */
async function dealInitialHands(
  sessionId: string,
  whiteCards: Card[],
  handSize: number,
): Promise<void> {
  const players = await db.query.player.findMany({
    where: eq(player.sessionId, sessionId),
  });

  let cardIndex = 0;

  for (const p of players) {
    const hand = whiteCards.slice(cardIndex, cardIndex + handSize).map(c => c.id);
    cardIndex += handSize;

    await db.update(player).set({ hand }).where(eq(player.id, p.id));
  }
}

/**
 * Validate that requesting user is the owner
 */
async function validateOwnership(sessionId: string, userId: string): Promise<void> {
  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
    with: { players: true },
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  const ownerPlayer = session.players.find(p => p.isOwner);
  if (!ownerPlayer || ownerPlayer.clerkUserId !== userId) {
    throw new GameError(GameErrorCode.NOT_OWNER, 'Only the game owner can perform this action');
  }
}

/**
 * Get full game session data
 */
export async function getGameSessionData(sessionId: string): Promise<GameSessionData> {
  const session = await db.query.gameSession.findFirst({
    where: eq(gameSession.id, sessionId),
    with: {
      players: true,
      decks: true,
    },
  });

  if (!session) {
    throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
  }

  return {
    id: session.id,
    joinCode: session.joinCode,
    ownerId: session.ownerId,
    status: session.status as GameStatus,
    currentRound: session.currentRound,
    settings: session.settings as GameSettings,
    players: session.players.map(toPlayerData),
    selectedDeckIds: session.decks.map(d => d.deckId),
    createdAt: session.createdAt,
  };
}

/**
 * Convert Player to PlayerData (without hand)
 */
function toPlayerData(p: Player): PlayerData {
  return {
    id: p.id,
    clerkUserId: p.clerkUserId,
    nickname: p.nickname,
    score: p.score,
    isCardCzar: p.isCardCzar,
    isOwner: p.isOwner,
    isConnected: p.isConnected,
  };
}

/**
 * Generate random 8-character join code
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding I, O, 0, 1 for clarity
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
