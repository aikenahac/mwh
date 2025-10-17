/**
 * Player List Component
 *
 * Displays list of players with indicators for owner, czar, and connection status.
 * Shows player nicknames and current scores.
 */

'use client';

import { Crown, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlayerData } from '@/lib/game/types';

interface PlayerListProps {
  players: PlayerData[];
  czarId?: string;
}

export function PlayerList({ players, czarId }: PlayerListProps) {
  const t = useTranslations();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2 px-1 lg:hidden">
        {t('game.players')}
      </h3>
      {players.map((player) => (
        <Card key={player.id}>
          <CardContent className="flex items-center justify-between p-2 sm:p-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {player.isOwner && <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />}
              {player.id === czarId && <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />}
              <span className="text-sm sm:text-base font-medium truncate">{player.nickname}</span>
              {!player.isConnected && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0 px-1 py-0">
                  disconnected
                </Badge>
              )}
            </div>
            <div className="text-sm sm:text-base font-bold flex-shrink-0 ml-2">{player.score}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
