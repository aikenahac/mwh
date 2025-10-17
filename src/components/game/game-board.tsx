/**
 * Game Board Component
 *
 * Main gameplay interface showing:
 * - Black card (question)
 * - Player's hand (if not czar)
 * - Submissions (if czar during judging phase)
 */

'use client';

import { useState } from 'react';
import { MWHCard } from '@/components/cards/mwh-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Card as CardData } from '@/lib/db/schema';
import type { RoundData, SubmissionData } from '@/lib/game/types';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/game/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameBoardProps {
  socket: GameSocket | null;
  currentRound: RoundData;
  myHand: CardData[];
  isCzar: boolean;
  submissions?: SubmissionData[];
}

export function GameBoard({
  socket,
  currentRound,
  myHand,
  isCzar,
  submissions,
}: GameBoardProps) {
  const t = useTranslations();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!socket || selectedCards.length !== currentRound.blackCard.pick) {
      toast.error(t('game.errors.wrongCardCount'));
      return;
    }

    setSubmitting(true);
    socket.emit(
      'submit-cards',
      { roundId: currentRound.id, cardIds: selectedCards },
      (response) => {
        if (response.success) {
          toast.success(t('game.cardsSubmitted'));
          setSelectedCards([]);
        } else {
          toast.error(response.error?.message);
        }
        setSubmitting(false);
      },
    );
  };

  const handleSelectWinner = (submissionId: string) => {
    if (!socket) return;

    socket.emit(
      'select-winner',
      { roundId: currentRound.id, submissionId },
      (response) => {
        if (!response.success) {
          toast.error(response.error?.message);
        }
      },
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Black Card */}
      <div className="flex justify-center">
        <div className="w-64">
          <MWHCard card={currentRound.blackCard} />
        </div>
      </div>

      {/* Czar View - Show Submissions */}
      {isCzar && submissions && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">
            {t('game.selectWinner')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectWinner(sub.id)}
              >
                <CardContent className="p-4 space-y-2">
                  {sub.cards.map((card) => (
                    <MWHCard key={card.id} card={card} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Player View - Show Hand */}
      {!isCzar && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('game.yourHand')}</h2>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || selectedCards.length !== currentRound.blackCard.pick
              }
            >
              {t('game.submitCards')}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {myHand.map((card) => (
              <button
                key={card.id}
                onClick={() => {
                  if (selectedCards.includes(card.id)) {
                    setSelectedCards(selectedCards.filter((id) => id !== card.id));
                  } else if (selectedCards.length < currentRound.blackCard.pick) {
                    setSelectedCards([...selectedCards, card.id]);
                  }
                }}
                className={selectedCards.includes(card.id) ? 'ring-4 ring-blue-500' : ''}
              >
                <MWHCard card={card} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
