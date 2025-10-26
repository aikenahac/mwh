/**
 * Game End Modal
 *
 * Displays when game completes, showing:
 * - Winner with trophy
 * - Final scores with placements
 * - Options to return to lobby or view game details
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { GameEndData } from '@/lib/game/types';
import { Trophy } from 'lucide-react';

interface GameEndModalProps {
  open: boolean;
  gameEndData: GameEndData | null;
}

export function GameEndModal({ open, gameEndData }: GameEndModalProps) {
  const t = useTranslations();
  const router = useRouter();

  if (!gameEndData) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {t('game.gameOver')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Winner */}
          <Card>
            <CardContent className="text-center space-y-3 p-6">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
              <h3 className="text-xl font-bold">
                {gameEndData.winner.nickname}
              </h3>
              <Badge variant="default" className="text-sm">
                {t('game.wins')}
              </Badge>
            </CardContent>
          </Card>

          <Separator />

          {/* Final Scores */}
          <div className="space-y-3">
            <h4 className="font-semibold">{t('game.finalScores')}</h4>
            {gameEndData.finalScores.map((player) => (
              <Card key={player.playerId}>
                <CardContent className="flex justify-between items-center p-3">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">#{player.placement}</Badge>
                    {player.nickname}
                  </span>
                  <span className="font-bold">{player.score}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/game')}
              className="flex-1"
            >
              {t('game.backToLobby')}
            </Button>
            <Button
              onClick={() =>
                router.push(`/game/history/${gameEndData.completedGameId}`)
              }
              className="flex-1"
            >
              {t('game.viewDetails')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
