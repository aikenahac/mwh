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
      {players.map((player) => (
        <Card key={player.id}>
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              {player.isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
              {player.id === czarId && <Star className="h-4 w-4 text-blue-500" />}
              <span className="font-medium">{player.nickname}</span>
              {!player.isConnected && (
                <Badge variant="secondary" className="text-xs">
                  disconnected
                </Badge>
              )}
            </div>
            <div className="text-sm font-bold">{player.score}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
