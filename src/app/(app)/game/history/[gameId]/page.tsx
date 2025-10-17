/**
 * Game Details Page
 *
 * Displays detailed information about a completed game including:
 * - Final scores and placements
 * - All rounds with cards played
 * - Winners of each round
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { MWHCard } from '@/components/cards/mwh-card';
import { useTranslations } from 'next-intl';
import type { GameDetailsData } from '@/lib/game/types';
import { Trophy, Crown, Clock, Users } from 'lucide-react';

export default function GameDetailsPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();

  const gameId = params.gameId as string;
  const [gameDetails, setGameDetails] = useState<GameDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/game/history/${gameId}?userId=${user.id}`,
        );
        const data = await response.json();

        if (data.success) {
          setGameDetails(data.data);
        }
      } catch (error) {
        console.error('[GameDetails] Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [user, gameId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!gameDetails) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold">{t('game.gameNotFound')}</h1>
          <Button onClick={() => router.push('/game/history')}>
            {t('game.backToHistory')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('game.gameDetails')}</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/game/history')}
          >
            {t('game.backToHistory')}
          </Button>
        </div>

        {/* Game Summary */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Trophy className="h-4 w-4" />
              <span>{t('game.winner')}</span>
            </div>
            <div className="font-semibold">{gameDetails.winner.nickname}</div>
            <div className="text-sm text-gray-600">
              {gameDetails.winner.score} {t('game.points')}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Users className="h-4 w-4" />
              <span>{t('game.players')}</span>
            </div>
            <div className="font-semibold">{gameDetails.players.length}</div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Clock className="h-4 w-4" />
              <span>{t('game.duration')}</span>
            </div>
            <div className="font-semibold">
              {gameDetails.durationMinutes} {t('game.minutes')}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-gray-600 mb-1">{t('game.rounds')}</div>
            <div className="font-semibold">{gameDetails.totalRoundsPlayed}</div>
          </div>
        </div>

        {/* Final Scores */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{t('game.finalScores')}</h2>
          <div className="grid gap-2">
            {gameDetails.players.map((player) => (
              <div
                key={player.nickname}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-gray-400">
                    #{player.placement}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {player.wasOwner && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium">{player.nickname}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {player.roundsWon} {t('game.roundsWon')}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold">{player.finalScore}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rounds */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('game.roundHistory')}</h2>
          {gameDetails.rounds.map((round) => (
            <div
              key={round.roundNumber}
              className="p-6 rounded-lg border bg-card space-y-4"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {t('game.round')} {round.roundNumber}
                </h3>
                <div className="text-sm text-gray-600">
                  {t('game.czar')}: {round.czarNickname}
                </div>
              </div>

              {/* Black Card */}
              <div className="flex justify-center">
                <div className="w-48">
                  <MWHCard card={round.blackCard} />
                </div>
              </div>

              {/* Winner */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold">
                    {round.winnerNickname} {t('game.wonThisRound')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {round.winningSubmission.map((card) => (
                    <div key={card.id} className="w-32">
                      <MWHCard card={card} />
                    </div>
                  ))}
                </div>
              </div>

              {/* All Submissions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">
                  {t('game.allSubmissions')}
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {round.allSubmissions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="text-sm font-medium mb-2">
                        {sub.playerNickname}
                      </div>
                      <div className="flex gap-2">
                        {sub.cards.map((card) => (
                          <div key={card.id} className="w-24">
                            <MWHCard card={card} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
