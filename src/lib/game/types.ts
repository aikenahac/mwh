/**
 * Game Type Definitions
 *
 * This file contains all TypeScript types for the multiplayer game system,
 * including socket events, game state, and data structures.
 */

import type { Card, Deck, Player, GameSession, Round, Submission } from '@/lib/db/schema';

// ============================================
// GAME SETTINGS
// ============================================

export interface GameSettings {
  pointsToWin: number;
  handSize: number;
  hasTimer: boolean;
  timerSeconds?: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  pointsToWin: 7,
  handSize: 10,
  hasTimer: false,
};

// ============================================
// GAME STATE TYPES
// ============================================

export type GameStatus = 'lobby' | 'playing' | 'ended' | 'abandoned';
export type RoundStatus = 'playing' | 'judging' | 'completed';

// ============================================
// PLAYER TYPES
// ============================================

export interface PlayerData {
  id: string;
  clerkUserId: string | null;
  nickname: string;
  score: number;
  isCardCzar: boolean;
  isOwner: boolean;
  isConnected: boolean;
}

export interface PlayerWithHand extends PlayerData {
  hand: string[]; // Array of card IDs
}

// ============================================
// DECK & CARD TYPES
// ============================================

export interface DeckWithCards extends Deck {
  cards: Card[];
}

export interface DeckInfo {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  isSystem: boolean;
  blackCardCount: number;
  whiteCardCount: number;
  sharedBy?: string; // Username if shared deck
}

export interface SelectedDecksInfo {
  decks: DeckInfo[];
  totalBlackCards: number;
  totalWhiteCards: number;
}

// ============================================
// ROUND TYPES
// ============================================

export interface RoundData {
  id: string;
  roundNumber: number;
  blackCard: Card;
  czarPlayerId: string;
  winnerPlayerId: string | null;
  status: RoundStatus;
  submissionCount: number; // How many players have submitted
  totalPlayers: number; // How many players need to submit (excluding czar)
}

export interface SubmissionData {
  id: string;
  playerId: string;
  playerNickname?: string; // Only revealed after winner selected
  cardIds: string[];
  cards: Card[]; // Populated when shown to czar
}

// ============================================
// GAME SESSION TYPES
// ============================================

export interface GameSessionData {
  id: string;
  joinCode: string;
  ownerId: string;
  status: GameStatus;
  currentRound: number;
  settings: GameSettings;
  players: PlayerData[];
  selectedDeckIds: string[];
  createdAt: Date;
}

export interface LobbyState extends GameSessionData {
  status: 'lobby';
  availableDecks?: DeckInfo[]; // Owner sees these
  selectedDecksInfo?: SelectedDecksInfo;
}

export interface PlayingState extends GameSessionData {
  status: 'playing';
  currentRoundData: RoundData;
}

// ============================================
// SOCKET EVENT TYPES
// ============================================

/**
 * CLIENT → SERVER EVENTS
 * Events sent from client to server
 */
export interface ClientToServerEvents {
  // Lobby events
  'create-game': (data: { nickname: string; clerkUserId: string | null }, callback: (response: SocketResponse<{ sessionId: string; joinCode: string }>) => void) => void;
  'join-game': (data: { joinCode: string; nickname: string; clerkUserId: string | null }, callback: (response: SocketResponse<{ session: GameSessionData }>) => void) => void;
  'leave-game': (data: { sessionId: string }, callback: (response: SocketResponse<void>) => void) => void;

  // Owner-only events
  'update-decks': (data: { sessionId: string; deckIds: string[]; clerkUserId: string | null }, callback: (response: SocketResponse<SelectedDecksInfo>) => void) => void;
  'update-settings': (data: { sessionId: string; settings: GameSettings; clerkUserId: string | null }, callback: (response: SocketResponse<void>) => void) => void;
  'start-game': (data: { sessionId: string; clerkUserId: string | null }, callback: (response: SocketResponse<void>) => void) => void;
  'kick-player': (data: { sessionId: string; playerId: string; clerkUserId: string | null }, callback: (response: SocketResponse<void>) => void) => void;
  'end-game-early': (data: { sessionId: string; clerkUserId: string | null }, callback: (response: SocketResponse<void>) => void) => void;

  // Gameplay events
  'submit-cards': (data: { roundId: string; cardIds: string[] }, callback: (response: SocketResponse<void>) => void) => void;
  'select-winner': (data: { roundId: string; submissionId: string }, callback: (response: SocketResponse<void>) => void) => void;

  // Connection events
  'reconnect-to-game': (data: { sessionId: string; clerkUserId: string | null; playerId?: string }, callback: (response: SocketResponse<{ session: GameSessionData; hand?: string[] }>) => void) => void;
}

/**
 * SERVER → CLIENT EVENTS
 * Events sent from server to client (broadcast or individual)
 */
export interface ServerToClientEvents {
  // Lobby events
  'game-created': (data: { sessionId: string; joinCode: string; ownerId: string }) => void;
  'player-joined': (data: { player: PlayerData }) => void;
  'player-left': (data: { playerId: string; playerNickname: string }) => void;
  'player-disconnected': (data: { playerId: string }) => void;
  'player-reconnected': (data: { playerId: string }) => void;

  // Deck selection events (owner updates)
  'decks-updated': (data: SelectedDecksInfo) => void;
  'settings-updated': (data: { settings: GameSettings }) => void;

  // Game start
  'game-started': (data: { players: PlayerData[]; settings: GameSettings }) => void;

  // Round events
  'round-started': (data: RoundData) => void;
  'cards-dealt': (data: { hand: string[] }) => void; // Individual event
  'card-submitted': (data: { submissionCount: number; totalPlayers: number }) => void;
  'all-cards-submitted': (data: { submissions: SubmissionData[] }) => void; // To czar only

  // Winner selection
  'winner-selected': (data: {
    winnerId: string;
    winnerNickname: string;
    winningSubmission: SubmissionData;
    points: number;
    allSubmissions: SubmissionData[]; // Now revealed with nicknames
  }) => void;
  'round-ended': (data: { scores: Array<{ playerId: string; score: number }>; nextCzarId: string }) => void;

  // Game end
  'game-ended': (data: GameEndData) => void;

  // Ownership transfer
  'owner-changed': (data: { newOwnerId: string; newOwnerNickname: string }) => void;

  // Error handling
  'error': (data: { message: string; code: string }) => void;
}

/**
 * Generic socket response wrapper
 */
export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Game End Data
 * Sent when a game completes
 */
export interface GameEndData {
  completedGameId: string;
  finalScores: Array<{
    playerId: string;
    nickname: string;
    score: number;
    placement: number;
  }>;
  winner: {
    playerId: string;
    nickname: string;
    score: number;
  };
  duration: number; // minutes
  totalRounds: number;
}

// ============================================
// GAME HISTORY TYPES
// ============================================

export interface GameHistoryItem {
  id: string;
  completedAt: Date;
  createdAt: Date;
  durationMinutes: number;
  totalRoundsPlayed: number;
  wasAbandoned: boolean;
  winnerNickname: string | null;
  playerCount: number;
  userPlacement: number;
  userScore: number;
  decks: Array<{
    id: string;
    name: string;
  }>;
}

export interface GameHistoryFilters {
  wonOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface GameHistorySortOption {
  field: 'completed_at' | 'created_at' | 'duration_minutes' | 'total_rounds_played';
  direction: 'asc' | 'desc';
}

export interface PaginatedGameHistory {
  items: GameHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// GAME DETAILS TYPES
// ============================================

export interface GameDetailsData {
  id: string;
  sessionId: string;
  completedAt: Date;
  createdAt: Date;
  durationMinutes: number;
  totalRoundsPlayed: number;
  wasAbandoned: boolean;
  settings: GameSettings;
  winner: {
    userId: string | null;
    nickname: string;
    score: number;
  };
  players: Array<{
    userId: string | null;
    nickname: string;
    finalScore: number;
    roundsWon: number;
    wasOwner: boolean;
    placement: number;
  }>;
  decks: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  rounds: Array<{
    roundNumber: number;
    blackCard: Card;
    czarNickname: string;
    winnerNickname: string;
    winningSubmission: Card[];
    allSubmissions: Array<{
      playerNickname: string;
      cards: Card[];
    }>;
    completedAt: Date;
  }>;
}

// ============================================
// PLAYER STATISTICS TYPES
// ============================================

export interface UserStatistics {
  userId: string;
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalRoundsWon: number;
  totalRoundsPlayed: number;
  winRate: number;
  favoriteWinningCards: Array<{
    card: Card;
    winCount: number;
  }>;
  lastPlayedAt: Date | null;
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export type LeaderboardMetric = 'wins' | 'win_rate' | 'rounds_won';

export interface LeaderboardEntry {
  userId: string;
  nickname?: string; // From most recent game
  rank: number;
  totalGamesWon: number;
  totalGamesPlayed: number;
  winRate: number;
  totalRoundsWon: number;
  lastPlayedAt: Date;
}

export interface LeaderboardData {
  metric: LeaderboardMetric;
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  totalPlayers: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// ============================================
// ERROR CODES
// ============================================

export enum GameErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_SESSION = 'INVALID_SESSION',

  // Game state errors
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_FULL = 'GAME_FULL',
  GAME_ALREADY_STARTED = 'GAME_ALREADY_STARTED',
  GAME_NOT_IN_LOBBY = 'GAME_NOT_IN_LOBBY',

  // Permission errors
  NOT_OWNER = 'NOT_OWNER',
  NOT_CZAR = 'NOT_CZAR',
  NOT_IN_GAME = 'NOT_IN_GAME',

  // Deck errors
  NO_DECKS_SELECTED = 'NO_DECKS_SELECTED',
  INVALID_DECK = 'INVALID_DECK',
  NOT_ENOUGH_CARDS = 'NOT_ENOUGH_CARDS',

  // Gameplay errors
  ALREADY_SUBMITTED = 'ALREADY_SUBMITTED',
  INVALID_SUBMISSION = 'INVALID_SUBMISSION',
  WRONG_NUMBER_OF_CARDS = 'WRONG_NUMBER_OF_CARDS',
  CARDS_NOT_IN_HAND = 'CARDS_NOT_IN_HAND',
  INVALID_WINNER_SELECTION = 'INVALID_WINNER_SELECTION',

  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameError';
  }
}
