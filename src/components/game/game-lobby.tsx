/**
 * Game Lobby Component
 *
 * Pre-game lobby where players wait for game to start.
 * Owner can select decks and start the game.
 * Displays join code and player list.
 */

'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerList } from './player-list';
import { DeckSelector } from './deck-selector';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { GameSessionData } from '@/lib/game/types';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/lib/game/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameLobbyProps {
  session: GameSessionData;
  socket: GameSocket | null;
  isOwner: boolean;
}

export function GameLobby({ session, socket, isOwner }: GameLobbyProps) {
  const t = useTranslations();
  const { user } = useUser();
  const [starting, setStarting] = useState(false);

  const handleStartGame = () => {
    if (!socket) return;
    if (session.selectedDeckIds.length === 0) {
      toast.error(t('game.errors.noDecksSelected'));
      return;
    }

    setStarting(true);
    socket.emit(
      'start-game',
      {
        sessionId: session.id,
        clerkUserId: user?.id || null,
      },
      (response) => {
        if (!response.success) {
          toast.error(response.error?.message);
          setStarting(false);
        }
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('game.lobby')}</h1>
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-3 sm:p-4">
            <span className="text-xs sm:text-sm">{t('game.joinCode')}:</span>
            <span className="text-xl sm:text-2xl font-mono font-bold">
              {session.joinCode}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Start Button (Owner Only) - Moved to top */}
      {isOwner && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleStartGame}
            disabled={
              starting ||
              session.players.length < 3 ||
              session.selectedDeckIds.length === 0
            }
            className="w-full sm:w-auto"
          >
            {starting ? t('game.starting') : t('game.startGame')}
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Players */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
            {t('game.players')}
          </h2>
          <PlayerList players={session.players} />
        </div>

        {/* Deck Selection (Owner Only) */}
        {isOwner && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              {t('game.selectDecks')}
            </h2>
            <DeckSelector
              sessionId={session.id}
              socket={socket}
              selectedDeckIds={session.selectedDeckIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
