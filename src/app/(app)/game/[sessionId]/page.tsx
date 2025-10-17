/**
 * Game Session Page
 *
 * Main page for active game sessions.
 * Handles all game states: lobby, playing, judging, game end.
 * Manages Socket.io connection and real-time updates.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useGameSocket } from '@/hooks/use-game-socket';
import { GameLobby } from '@/components/game/game-lobby';
import { GameBoard } from '@/components/game/game-board';
import { GameEndModal } from '@/components/game/game-end-modal';
import { PlayerList } from '@/components/game/player-list';
import { toast } from 'sonner';
import type {
  GameSessionData,
  RoundData,
  SubmissionData,
  GameEndData,
  PlayerData,
} from '@/lib/game/types';
import type { Card } from '@/lib/db/schema';

export default function GameSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { socket, connected } = useGameSocket();

  const sessionId = params.sessionId as string;

  // Game state
  const [session, setSession] = useState<GameSessionData | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived state
  const myPlayer = session?.players.find(
    (p) => p.clerkUserId === user?.id || p.id === socket?.id,
  );
  const isOwner = myPlayer?.isOwner || false;
  const isCzar = myPlayer?.id === currentRound?.czarPlayerId;

  // Initialize: Join or reconnect to game
  useEffect(() => {
    if (!socket || !connected || !sessionId) return;

    // Try to reconnect first (in case we disconnected)
    socket.emit(
      'reconnect-to-game',
      { sessionId, clerkUserId: user?.id || null },
      (response) => {
        if (response.success && response.data) {
          setSession(response.data.session);
          if (response.data.hand) {
            // TODO: Fetch full card data for hand
          }
          setLoading(false);
        } else {
          // Not in game yet or can't reconnect
          setLoading(false);
        }
      },
    );
  }, [socket, connected, sessionId, user?.id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Lobby events
    socket.on('player-joined', (data) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, data.player],
        };
      });
      toast.success(`${data.player.nickname} joined`);
    });

    socket.on('player-left', (data) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== data.playerId),
        };
      });
      toast.info(`${data.playerNickname} left`);
    });

    socket.on('player-disconnected', (data) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === data.playerId ? { ...p, isConnected: false } : p,
          ),
        };
      });
    });

    socket.on('player-reconnected', (data) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === data.playerId ? { ...p, isConnected: true } : p,
          ),
        };
      });
    });

    socket.on('decks-updated', (data) => {
      toast.success('Decks updated');
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          selectedDeckIds: data.decks.map((d) => d.id),
        };
      });
    });

    socket.on('settings-updated', (data) => {
      toast.success('Settings updated');
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          settings: data.settings,
        };
      });
    });

    // Game start
    socket.on('game-started', (data) => {
      toast.success('Game started!');
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'playing',
          players: data.players,
          settings: data.settings,
        };
      });
    });

    // Round events
    socket.on('round-started', (data) => {
      setCurrentRound(data);
      setSubmissions([]);
    });

    socket.on('cards-dealt', (data) => {
      // TODO: Fetch full card data from IDs
      // For now, store IDs
      console.log('Cards dealt:', data.hand);
    });

    socket.on('card-submitted', (data) => {
      if (currentRound) {
        setCurrentRound({
          ...currentRound,
          submissionCount: data.submissionCount,
          totalPlayers: data.totalPlayers,
        });
      }
    });

    socket.on('all-cards-submitted', (data) => {
      setSubmissions(data.submissions);
      toast.info('All cards submitted! Czar is choosing...');
    });

    // Winner selection
    socket.on('winner-selected', (data) => {
      toast.success(`${data.winnerNickname} won the round!`);
      setSubmissions(data.allSubmissions);
    });

    socket.on('round-ended', (data) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) => {
            const scoreUpdate = data.scores.find((s) => s.playerId === p.id);
            return scoreUpdate ? { ...p, score: scoreUpdate.score } : p;
          }),
        };
      });
      setCurrentRound(null);
    });

    // Game end
    socket.on('game-ended', (data) => {
      setGameEndData(data);
      setSession((prev) => (prev ? { ...prev, status: 'ended' } : prev));
    });

    socket.on('owner-changed', (data) => {
      toast.info(`${data.newOwnerNickname} is now the owner`);
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) => ({
            ...p,
            isOwner: p.id === data.newOwnerId,
          })),
        };
      });
    });

    socket.on('error', (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('player-disconnected');
      socket.off('player-reconnected');
      socket.off('decks-updated');
      socket.off('settings-updated');
      socket.off('game-started');
      socket.off('round-started');
      socket.off('cards-dealt');
      socket.off('card-submitted');
      socket.off('all-cards-submitted');
      socket.off('winner-selected');
      socket.off('round-ended');
      socket.off('game-ended');
      socket.off('owner-changed');
      socket.off('error');
    };
  }, [socket, currentRound]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Game not found</h1>
          <button
            onClick={() => router.push('/game')}
            className="text-blue-600 hover:underline"
          >
            Back to games
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Lobby State */}
      {session.status === 'lobby' && (
        <GameLobby session={session} socket={socket} isOwner={isOwner} />
      )}

      {/* Playing State */}
      {session.status === 'playing' && currentRound && (
        <div className="space-y-6">
          {/* Sidebar with players */}
          <div className="fixed right-4 top-20 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <PlayerList players={session.players} czarId={currentRound.czarPlayerId} />
          </div>

          {/* Main game board */}
          <div className="mr-72">
            <GameBoard
              socket={socket}
              currentRound={currentRound}
              myHand={myHand}
              isCzar={isCzar || false}
              submissions={isCzar ? submissions : undefined}
            />
          </div>
        </div>
      )}

      {/* Game End Modal */}
      <GameEndModal open={!!gameEndData} gameEndData={gameEndData} />
    </>
  );
}
