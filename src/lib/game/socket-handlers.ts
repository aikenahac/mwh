/**
 * Socket.io Event Handlers
 *
 * This file contains all socket event handlers that wire client events
 * to game service functions and emit responses back to clients.
 *
 * Event Flow:
 * 1. Client emits event → arrives here
 * 2. Handler calls game-service function
 * 3. Handler emits response/broadcast to client(s)
 *
 * All handlers include error handling and logging.
 */

import type { Socket, Server as SocketIOServer } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './types';
import * as gameService from './game-service';
import * as deckService from './deck-service';
import * as archiveService from './archive-service';
import { db } from '@/lib/db';
import { player, round, gameSession, submission, card } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { GameError, GameErrorCode } from './types';
import type { Card } from '@/lib/db/schema';

// In-memory storage for active game card pools
// Key: sessionId, Value: { blackCards, whiteCards, currentBlackIndex }
const gameCardPools = new Map<
  string,
  {
    blackCards: Card[];
    whiteCards: Card[];
    currentBlackIndex: number;
    currentWhiteIndex: number;
  }
>();

// Socket ID to player ID mapping (for quick lookups)
const socketToPlayer = new Map<
  string,
  { playerId: string; sessionId: string }
>();

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

/**
 * Attach all game event handlers to a socket
 */
export function attachGameHandlers(socket: GameSocket, io: GameIO): void {
  // ============================================
  // LOBBY EVENTS
  // ============================================

  /**
   * CREATE GAME
   * Creates a new game session and adds the owner as first player
   */
  socket.on('create-game', async (data, callback) => {
    try {
      const { sessionId, joinCode } = await gameService.createGameSession(
        data.clerkUserId || `guest_${socket.id}`,
        data.nickname,
      );

      // Get the created session with player data
      const session = await gameService.getGameSessionData(sessionId);
      const ownerPlayer = session.players.find((p) => p.isOwner)!;

      // Join socket room
      socket.join(sessionId);

      // Map socket to player
      socketToPlayer.set(socket.id, { playerId: ownerPlayer.id, sessionId });

      console.log(`[Game] Created: ${sessionId} by ${data.nickname}`);

      callback({
        success: true,
        data: { sessionId, joinCode },
      });

      // Emit to room (just the creator for now)
      io.to(sessionId).emit('game-created', {
        sessionId,
        joinCode,
        ownerId: data.clerkUserId || `guest_${socket.id}`,
      });
    } catch (error) {
      console.error('[create-game] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to create game',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * JOIN GAME
   * Adds a player to an existing game session
   */
  socket.on('join-game', async (data, callback) => {
    try {
      const session = await gameService.joinGameSession(
        data.joinCode,
        data.clerkUserId,
        data.nickname,
      );

      // Join socket room
      socket.join(session.id);

      // Get the newly joined player
      const newPlayer = session.players[session.players.length - 1];

      // Map socket to player
      socketToPlayer.set(socket.id, {
        playerId: newPlayer.id,
        sessionId: session.id,
      });

      console.log(`[Game] Player ${data.nickname} joined ${session.id}`);

      callback({ success: true, data: { session } });

      // Notify all players in the room
      io.to(session.id).emit('player-joined', { player: newPlayer });
    } catch (error) {
      console.error('[join-game] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to join game',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * LEAVE GAME
   * Removes a player from the game session
   */
  socket.on('leave-game', async (data, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) {
        throw new GameError(GameErrorCode.NOT_IN_GAME, 'Not in a game');
      }

      // Get player data before leaving
      const playerData = await db.query.player.findFirst({
        where: eq(player.id, playerInfo.playerId),
      });

      await gameService.leaveGameSession(data.sessionId, playerInfo.playerId);

      // Leave socket room
      socket.leave(data.sessionId);
      socketToPlayer.delete(socket.id);

      console.log(
        `[Game] Player ${playerData?.nickname} left ${data.sessionId}`,
      );

      callback({ success: true });

      // Notify others
      io.to(data.sessionId).emit('player-left', {
        playerId: playerInfo.playerId,
        playerNickname: playerData?.nickname || 'Unknown',
      });
    } catch (error) {
      console.error('[leave-game] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to leave game',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * UPDATE DECKS (Owner only)
   * Updates the selected decks for the game
   */
  socket.on('update-decks', async (data, callback) => {
    try {
      const userId = data.clerkUserId || `guest_${socket.id}`;

      await gameService.updateSessionDecks(
        data.sessionId,
        data.deckIds,
        userId,
      );

      const decksInfo = await deckService.getSelectedDecksInfo(data.deckIds);

      console.log(
        `[Game] Decks updated for ${data.sessionId}: ${data.deckIds.length} decks`,
      );

      callback({ success: true, data: decksInfo });

      // Broadcast to all in room
      io.to(data.sessionId).emit('decks-updated', decksInfo);
    } catch (error) {
      console.error('[update-decks] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to update decks',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * UPDATE SETTINGS (Owner only)
   * Updates game settings (points to win, hand size, etc.)
   */
  socket.on('update-settings', async (data, callback) => {
    try {
      const userId = data.clerkUserId || `guest_${socket.id}`;

      await gameService.updateGameSettings(
        data.sessionId,
        data.settings,
        userId,
      );

      console.log(`[Game] Settings updated for ${data.sessionId}`);

      callback({ success: true });

      // Broadcast to all in room
      io.to(data.sessionId).emit('settings-updated', {
        settings: data.settings,
      });
    } catch (error) {
      console.error('[update-settings] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update settings',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  // ============================================
  // GAME START
  // ============================================

  /**
   * START GAME (Owner only)
   * Begins the game, deals cards, starts first round
   */
  socket.on('start-game', async (data, callback) => {
    try {
      const userId = data.clerkUserId || `guest_${socket.id}`;

      const { blackCards, whiteCards, initialWhiteIndex } = await gameService.startGame(
        data.sessionId,
        userId,
      );

      // Store card pools in memory
      gameCardPools.set(data.sessionId, {
        blackCards,
        whiteCards,
        currentBlackIndex: 0,
        currentWhiteIndex: initialWhiteIndex,
      });

      console.log(`[Game] Started: ${data.sessionId}`);

      callback({ success: true });

      // Get updated session
      const session = await gameService.getGameSessionData(data.sessionId);

      // Emit game started to all
      io.to(data.sessionId).emit('game-started', {
        players: session.players,
        settings: session.settings,
      });

      // Deal hands to each player individually
      const players = await db.query.player.findMany({
        where: eq(player.sessionId, data.sessionId),
      });

      // Start first round (before dealing cards so we know who the czar is)
      const firstCzar = session.players[0];
      const firstBlackCard = blackCards[0];

      const newRound = await gameService.startRound(
        data.sessionId,
        1,
        firstBlackCard.id,
        firstCzar.id,
      );

      // Deal cards to all players EXCEPT the czar
      for (const p of players) {
        // Skip the czar - they don't need cards
        if (p.id === firstCzar.id) continue;

        // Find socket for this player
        const playerSocketId = findSocketIdByPlayerId(p.id);
        if (playerSocketId) {
          io.to(playerSocketId).emit('cards-dealt', {
            hand: p.hand as string[],
          });
        }
      }

      // Update black card index
      const pools = gameCardPools.get(data.sessionId)!;
      pools.currentBlackIndex = 1;

      io.to(data.sessionId).emit('round-started', {
        id: newRound.id,
        roundNumber: 1,
        blackCard: firstBlackCard,
        czarPlayerId: firstCzar.id,
        winnerPlayerId: null,
        status: 'playing',
        submissionCount: 0,
        totalPlayers: session.players.length - 1,
      });
    } catch (error) {
      console.error('[start-game] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to start game',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  // ============================================
  // GAMEPLAY EVENTS
  // ============================================

  /**
   * SUBMIT CARDS
   * Player submits white cards for the current round
   */
  socket.on('submit-cards', async (data, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) {
        throw new GameError(GameErrorCode.NOT_IN_GAME, 'Not in a game');
      }

      await gameService.submitCards(
        data.roundId,
        playerInfo.playerId,
        data.cardIds,
      );

      console.log(`[Game] Cards submitted for round ${data.roundId}`);

      callback({ success: true });

      // Get current round with submissions
      const currentRound = await db.query.round.findFirst({
        where: eq(round.id, data.roundId),
        with: {
          submissions: true,
          session: {
            with: {
              players: true,
            },
          },
        },
      });

      if (!currentRound) return;

      const totalPlayers = currentRound.session.players.length - 1; // Exclude czar
      const submissionCount = currentRound.submissions.length;

      // Broadcast submission count
      io.to(currentRound.sessionId).emit('card-submitted', {
        submissionCount,
        totalPlayers,
      });

      // If all submitted, send to czar
      if (submissionCount === totalPlayers) {
        // Get card data for submissions
        const submissionsWithCards = await Promise.all(
          currentRound.submissions.map(async (sub) => {
            const cards = await db.query.card.findMany({
              where: (card, { inArray }) =>
                inArray(card.id, sub.cardIds as string[]),
            });
            return {
              id: sub.id,
              playerId: sub.playerId,
              cardIds: sub.cardIds as string[],
              cards,
            };
          }),
        );

        // Shuffle submissions
        shuffleArray(submissionsWithCards);

        // Send to czar only
        const czarSocketId = findSocketIdByPlayerId(currentRound.czarPlayerId);
        if (czarSocketId) {
          io.to(czarSocketId).emit('all-cards-submitted', {
            submissions: submissionsWithCards,
          });
        }
      }
    } catch (error) {
      console.error('[submit-cards] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to submit cards',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * SELECT WINNER (Czar only)
   * Card Czar selects the winning submission
   */
  socket.on('select-winner', async (data, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) {
        throw new GameError(GameErrorCode.NOT_IN_GAME, 'Not in a game');
      }

      const { winnerId, winnerScore } = await gameService.selectWinner(
        data.roundId,
        data.submissionId,
        playerInfo.playerId,
      );

      console.log(`[Game] Winner selected for round ${data.roundId}`);

      callback({ success: true });

      // Get full round data
      const currentRound = await db.query.round.findFirst({
        where: eq(round.id, data.roundId),
        with: {
          submissions: true,
          session: {
            with: {
              players: true,
            },
          },
        },
      });

      if (!currentRound) return;

      // Get winner player
      const winner = currentRound.session.players.find(
        (p) => p.id === winnerId,
      )!;

      // Get winning submission with cards
      const winningSubmission = currentRound.submissions.find(
        (s) => s.id === data.submissionId,
      )!;
      const winningCards = await db.query.card.findMany({
        where: (card, { inArray }) =>
          inArray(card.id, winningSubmission.cardIds as string[]),
      });

      // Get all submissions with player info and cards
      const allSubmissions = await Promise.all(
        currentRound.submissions.map(async (sub) => {
          const submitter = currentRound.session.players.find(
            (p) => p.id === sub.playerId,
          )!;
          const cards = await db.query.card.findMany({
            where: (card, { inArray }) =>
              inArray(card.id, sub.cardIds as string[]),
          });
          return {
            id: sub.id,
            playerId: sub.playerId,
            playerNickname: submitter.nickname,
            cardIds: sub.cardIds as string[],
            cards,
          };
        }),
      );

      // Broadcast winner
      io.to(currentRound.sessionId).emit('winner-selected', {
        winnerId,
        winnerNickname: winner.nickname,
        winningSubmission: {
          id: winningSubmission.id,
          playerId: winnerId,
          playerNickname: winner.nickname,
          cardIds: winningSubmission.cardIds as string[],
          cards: winningCards,
        },
        points: winnerScore,
        allSubmissions,
      });

      // Check if game ended
      const { shouldEnd, winner: gameWinner } = await gameService.checkGameEnd(
        currentRound.sessionId,
      );

      if (shouldEnd && gameWinner) {
        // Archive game
        const gameEndData = await archiveService.archiveCompletedGame(
          currentRound.sessionId,
        );

        console.log(
          `[Game] Ended: ${currentRound.sessionId}, winner: ${gameWinner.nickname}`,
        );

        // Emit game ended
        io.to(currentRound.sessionId).emit('game-ended', gameEndData);

        // Clean up
        gameCardPools.delete(currentRound.sessionId);
      } else {
        // Continue to next round
        await startNextRound(
          currentRound.sessionId,
          currentRound.roundNumber,
          io,
        );
      }
    } catch (error) {
      console.error('[select-winner] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to select winner',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * KICK PLAYER (Owner only)
   * Removes a player from the game
   */
  socket.on('kick-player', async (data, callback) => {
    try {
      const userId = data.clerkUserId || `guest_${socket.id}`;

      // Verify ownership
      const session = await db.query.gameSession.findFirst({
        where: eq(gameSession.id, data.sessionId),
        with: { players: true },
      });

      if (!session) {
        throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
      }

      const owner = session.players.find((p) => p.isOwner);
      if (!owner || owner.clerkUserId !== userId) {
        throw new GameError(
          GameErrorCode.NOT_OWNER,
          'Only owner can kick players',
        );
      }

      // Get kicked player data
      const kickedPlayer = await db.query.player.findFirst({
        where: eq(player.id, data.playerId),
      });

      await gameService.leaveGameSession(data.sessionId, data.playerId);

      // Find and disconnect their socket
      const kickedSocketId = findSocketIdByPlayerId(data.playerId);
      if (kickedSocketId) {
        const kickedSocket = io.sockets.sockets.get(kickedSocketId);
        kickedSocket?.leave(data.sessionId);
        socketToPlayer.delete(kickedSocketId);
      }

      console.log(
        `[Game] Player ${kickedPlayer?.nickname} kicked from ${data.sessionId}`,
      );

      callback({ success: true });

      // Notify others
      io.to(data.sessionId).emit('player-left', {
        playerId: data.playerId,
        playerNickname: kickedPlayer?.nickname || 'Unknown',
      });
    } catch (error) {
      console.error('[kick-player] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to kick player',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * END GAME EARLY (Owner only)
   * Ends the game before someone reaches the point goal
   */
  socket.on('end-game-early', async (data, callback) => {
    try {
      const userId = data.clerkUserId || `guest_${socket.id}`;

      // Verify ownership
      const session = await db.query.gameSession.findFirst({
        where: eq(gameSession.id, data.sessionId),
        with: { players: true },
      });

      if (!session) {
        throw new GameError(GameErrorCode.GAME_NOT_FOUND, 'Game not found');
      }

      const owner = session.players.find((p) => p.isOwner);
      if (!owner || owner.clerkUserId !== userId) {
        throw new GameError(GameErrorCode.NOT_OWNER, 'Only owner can end game');
      }

      // Archive game
      const gameEndData = await archiveService.archiveCompletedGame(
        data.sessionId,
      );

      console.log(`[Game] Ended early: ${data.sessionId}`);

      callback({ success: true });

      // Emit game ended
      io.to(data.sessionId).emit('game-ended', gameEndData);

      // Clean up
      gameCardPools.delete(data.sessionId);
    } catch (error) {
      console.error('[end-game-early] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to end game',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  /**
   * RECONNECT TO GAME
   * Reconnects a disconnected player to their game
   */
  socket.on('reconnect-to-game', async (data, callback) => {
    try {
      console.log(
        `[reconnect-to-game] Attempt - sessionId: ${data.sessionId}, clerkUserId: ${data.clerkUserId}, playerId: ${data.playerId}, socketId: ${socket.id}`,
      );

      const session = await gameService.getGameSessionData(data.sessionId);
      console.log(
        `[reconnect-to-game] Session found with ${session.players.length} players`,
      );

      // Find player in session
      let playerData;

      // 1. Try by clerkUserId (for authenticated users)
      if (data.clerkUserId) {
        playerData = session.players.find(
          (p) =>
            p.clerkUserId === data.clerkUserId && data.clerkUserId !== null,
        );
        console.log(
          `[reconnect-to-game] Player found by clerkUserId: ${!!playerData}`,
        );
      }

      // 2. Try by playerId from sessionStorage (for guests who just joined)
      if (!playerData && data.playerId) {
        playerData = session.players.find((p) => p.id === data.playerId);
        console.log(
          `[reconnect-to-game] Player found by playerId: ${!!playerData}`,
        );
      }

      // 3. Check if this socket is already mapped to a player in this session
      if (!playerData) {
        const existingMapping = socketToPlayer.get(socket.id);
        console.log(
          `[reconnect-to-game] Existing socket mapping: ${JSON.stringify(existingMapping)}`,
        );

        if (existingMapping && existingMapping.sessionId === data.sessionId) {
          playerData = session.players.find(
            (p) => p.id === existingMapping.playerId,
          );
          console.log(
            `[reconnect-to-game] Player found by socket mapping: ${!!playerData}`,
          );
        }
      }

      // 4. Fallback: if there's only one guest player, use them
      if (!playerData) {
        const guestPlayers = session.players.filter(
          (p) => p.clerkUserId === null,
        );
        console.log(
          `[reconnect-to-game] Found ${guestPlayers.length} guest players in session`,
        );

        if (guestPlayers.length === 1) {
          playerData = guestPlayers[0];
          console.log(
            `[reconnect-to-game] Using sole guest player: ${playerData.nickname}`,
          );
        }
      }

      if (!playerData) {
        console.log(`[reconnect-to-game] No player found - FAILING`);
        throw new GameError(GameErrorCode.NOT_IN_GAME, 'Not in this game');
      }

      // Update player connection status
      await db
        .update(player)
        .set({ isConnected: true })
        .where(eq(player.id, playerData.id));

      // Rejoin socket room
      socket.join(data.sessionId);
      socketToPlayer.set(socket.id, {
        playerId: playerData.id,
        sessionId: data.sessionId,
      });

      // Get player's hand
      const fullPlayer = await db.query.player.findFirst({
        where: eq(player.id, playerData.id),
      });

      console.log(
        `[Game] Player reconnected: ${playerData.nickname} to ${data.sessionId}`,
      );

      callback({
        success: true,
        data: {
          session,
          hand: (fullPlayer?.hand as string[]) || [],
        },
      });

      // Notify others
      io.to(data.sessionId).emit('player-reconnected', {
        playerId: playerData.id,
      });
    } catch (error) {
      console.error('[reconnect-to-game] Error:', error);
      callback({
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to reconnect',
          code:
            error instanceof GameError
              ? error.code
              : GameErrorCode.INTERNAL_ERROR,
        },
      });
    }
  });

  // ============================================
  // DISCONNECTION HANDLING
  // ============================================

  socket.on('disconnect', async () => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (playerInfo) {
      try {
        // Mark player as disconnected
        await db
          .update(player)
          .set({ isConnected: false })
          .where(eq(player.id, playerInfo.playerId));

        // Check if disconnected player is the current czar
        const session = await gameService.getGameSessionData(
          playerInfo.sessionId,
        );
        const disconnectedPlayer = session.players.find(
          (p) => p.id === playerInfo.playerId,
        );

        if (disconnectedPlayer?.isCardCzar && session.status === 'playing') {
          // Czar disconnected during active game - auto-select random winner after 30 seconds
          console.log(
            `[Game] Card Czar disconnected, starting auto-select timer`,
          );

          setTimeout(
            async () => {
              try {
                // Check if czar is still disconnected
                const currentPlayer = await db.query.player.findFirst({
                  where: eq(player.id, playerInfo.playerId),
                });

                if (currentPlayer && !currentPlayer.isConnected) {
                  // Get current round
                  const currentRound = await db.query.round.findFirst({
                    where: and(
                      eq(round.sessionId, playerInfo.sessionId),
                      eq(round.status, 'playing'),
                    ),
                    with: { submissions: true },
                  });

                  if (
                    currentRound &&
                    currentRound.czarPlayerId === playerInfo.playerId
                  ) {
                    // Auto-select random winner
                    if (currentRound.submissions.length > 0) {
                      const randomSubmission =
                        currentRound.submissions[
                          Math.floor(
                            Math.random() * currentRound.submissions.length,
                          )
                        ];
                      console.log(
                        `[Game] Auto-selecting random winner due to czar disconnect`,
                      );

                      // Use the select-winner handler logic
                      const result = await gameService.selectWinner(
                        currentRound.id,
                        randomSubmission.id,
                        playerInfo.playerId,
                      );

                      // Emit winner-selected event
                      const winnerPlayer = session.players.find(
                        (p) => p.id === result.winnerId,
                      );

                      // Get all submissions with their cards
                      const allSubmissions =
                        await db.query.submission.findMany({
                          where: eq(submission.roundId, currentRound.id),
                        });

                      // Fetch card data for all submissions
                      const submissionsWithCards = await Promise.all(
                        allSubmissions.map(async (sub) => {
                          const cardIds = sub.cardIds as string[];
                          const cards = await db.query.card.findMany({
                            where: inArray(card.id, cardIds),
                          });
                          return {
                            id: sub.id,
                            playerId: sub.playerId,
                            cardIds,
                            cards,
                            isWinner: sub.id === randomSubmission.id,
                          };
                        }),
                      );

                      // Find the winning submission with cards
                      const winningSubmissionData = submissionsWithCards.find(
                        (s) => s.id === randomSubmission.id,
                      )!;

                      io.to(playerInfo.sessionId).emit('winner-selected', {
                        winnerId: result.winnerId,
                        winnerNickname: winnerPlayer?.nickname || 'Unknown',
                        winningSubmission: {
                          id: winningSubmissionData.id,
                          playerId: winningSubmissionData.playerId,
                          playerNickname: winnerPlayer?.nickname || 'Unknown',
                          cardIds: winningSubmissionData.cardIds,
                          cards: winningSubmissionData.cards,
                        },
                        points: result.winnerScore,
                        allSubmissions: submissionsWithCards,
                      });
                    }
                  }
                }
              } catch (error) {
                console.error('[Game] Error auto-selecting winner:', error);
              }
            },
            30 * 1000,
          ); // 30 second delay
        }

        // Notify others
        io.to(playerInfo.sessionId).emit('player-disconnected', {
          playerId: playerInfo.playerId,
        });

        console.log(`[Game] Player disconnected from ${playerInfo.sessionId}`);

        // Clean up after 5 minutes if not reconnected
        setTimeout(
          async () => {
            const stillDisconnected = await db.query.player.findFirst({
              where: and(
                eq(player.id, playerInfo.playerId),
                eq(player.isConnected, false),
              ),
            });

            if (stillDisconnected) {
              // Remove player from game
              await gameService.leaveGameSession(
                playerInfo.sessionId,
                playerInfo.playerId,
              );

              io.to(playerInfo.sessionId).emit('player-left', {
                playerId: playerInfo.playerId,
                playerNickname: stillDisconnected.nickname,
              });

              console.log(
                `[Game] Player ${stillDisconnected.nickname} removed after timeout`,
              );
            }
          },
          5 * 60 * 1000,
        );
      } catch (error) {
        console.error('[disconnect] Error handling disconnection:', error);
      }

      socketToPlayer.delete(socket.id);
    }
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Start the next round
 */
async function startNextRound(
  sessionId: string,
  previousRoundNumber: number,
  io: GameIO,
): Promise<void> {
  const session = await gameService.getGameSessionData(sessionId);
  const pools = gameCardPools.get(sessionId);

  if (!pools) {
    console.error(
      `[startNextRound] No card pools found for session ${sessionId}`,
    );
    return;
  }

  // Deal replacement cards
  const { nextIndex } = await gameService.dealReplacementCards(
    sessionId,
    pools.whiteCards,
    session.settings.handSize,
    pools.currentWhiteIndex,
  );

  // Update white card index
  pools.currentWhiteIndex = nextIndex;

  // Get next czar
  const currentCzar = session.players.find((p) => p.isCardCzar)!;
  const nextCzar = await gameService.getNextCzar(sessionId, currentCzar.id);

  // Get next black card
  const nextBlackCard = pools.blackCards[pools.currentBlackIndex];
  if (!nextBlackCard) {
    console.error(
      `[startNextRound] No more black cards for session ${sessionId}`,
    );
    // End game due to cards running out
    console.log(`[startNextRound] Ending game due to card exhaustion`);
    const gameEndData = await archiveService.archiveCompletedGame(sessionId);
    io.to(sessionId).emit('game-ended', gameEndData);
    gameCardPools.delete(sessionId);
    return;
  }

  // Start round
  const newRound = await gameService.startRound(
    sessionId,
    previousRoundNumber + 1,
    nextBlackCard.id,
    nextCzar.id,
  );

  // Update black card index
  pools.currentBlackIndex++;

  // Deal updated hands to players EXCEPT the czar
  const players = await db.query.player.findMany({
    where: eq(player.sessionId, sessionId),
  });

  for (const p of players) {
    // Skip the czar - they don't need cards
    if (p.id === nextCzar.id) continue;

    const socketId = findSocketIdByPlayerId(p.id);
    if (socketId) {
      io.to(socketId).emit('cards-dealt', { hand: p.hand as string[] });
    }
  }

  // Emit round started
  io.to(sessionId).emit('round-started', {
    id: newRound.id,
    roundNumber: previousRoundNumber + 1,
    blackCard: nextBlackCard,
    czarPlayerId: nextCzar.id,
    winnerPlayerId: null,
    status: 'playing',
    submissionCount: 0,
    totalPlayers: session.players.length - 1,
  });
}

/**
 * Find socket ID by player ID
 */
function findSocketIdByPlayerId(playerId: string): string | null {
  for (const [socketId, info] of socketToPlayer.entries()) {
    if (info.playerId === playerId) {
      return socketId;
    }
  }
  return null;
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
