/**
 * Game History Page
 *
 * Displays user's game history with pagination and filters.
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import type { PaginatedGameHistory } from '@/lib/game/types';
import { Trophy, Users, Clock } from 'lucide-react';

export default function GameHistoryPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useUser();

  const [history, setHistory] = useState<PaginatedGameHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [selectedGameDecks, setSelectedGameDecks] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const MAX_VISIBLE_DECKS = 15;

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/game/history?userId=${user.id}&page=${page}&pageSize=20`,
        );
        const data = await response.json();

        console.log('[GameHistory] Response:', data);

        if (data.success) {
          setHistory(data.data);
        } else {
          console.error('[GameHistory] API error:', data.error);
        }
      } catch (error) {
        console.error('[GameHistory] Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, page]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!history || history.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold">{t('game.history')}</h1>
          <p className="text-gray-600">{t('game.noGamesYet')}</p>
          <Button onClick={() => router.push('/game')}>
            {t('game.startPlaying')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('game.history')}</h1>
          <Button variant="outline" onClick={() => router.push('/game')}>
            {t('game.backToGames')}
          </Button>
        </div>

        {/* Game List */}
        <div className="space-y-4">
          {history.items.map((game) => (
            <Card
              key={game.id}
              className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
              onClick={() => router.push(`/game/history/${game.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Game Info */}
                    <div className="flex items-center gap-3">
                      {game.userPlacement === 1 && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-semibold">
                        {game.wasAbandoned
                          ? t('game.abandoned')
                          : game.winnerNickname === user?.firstName
                            ? t('game.youWon')
                            : `${game.winnerNickname} ${t('game.won')}`}
                      </span>
                    </div>

                    {/* Decks */}
                    <div className="flex flex-wrap gap-2">
                      {game.decks.slice(0, MAX_VISIBLE_DECKS).map((deck) => (
                        <Badge key={deck.id} variant="secondary">
                          {deck.name}
                        </Badge>
                      ))}
                      {game.decks.length > MAX_VISIBLE_DECKS && (
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGameDecks(game.decks);
                            setDeckDialogOpen(true);
                          }}
                        >
                          +{game.decks.length - MAX_VISIBLE_DECKS} more
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {game.playerCount} {t('game.players')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {game.durationMinutes} {t('game.minutes')}
                        </span>
                      </div>
                      <span>
                        {game.totalRoundsPlayed} {t('game.rounds')}
                      </span>
                    </div>
                  </div>

                  {/* Placement & Score */}
                  <div className="text-right space-y-1">
                    <Badge variant="outline" className="text-2xl font-bold">
                      #{game.userPlacement}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {game.userScore} {t('game.points')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(game.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {history.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('common.page')} {page} {t('common.of')} {history.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setPage((p) => Math.min(history.totalPages, p + 1))
              }
              disabled={page === history.totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* All Decks Dialog */}
      <Dialog open={deckDialogOpen} onOpenChange={setDeckDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Decks ({selectedGameDecks.length})</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {selectedGameDecks.map((deck) => (
              <div
                key={deck.id}
                className="p-2 rounded-md border bg-card text-sm truncate"
                title={deck.name}
              >
                {deck.name}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
