/**
 * Game Board Component
 *
 * Main gameplay interface showing:
 * - Black card (question)
 * - Player's hand (if not czar)
 * - Submissions (if czar during judging phase)
 */

'use client';

import { useState, useEffect } from 'react';
import { MWHCard } from '@/components/cards/mwh-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Card as CardData } from '@/lib/db/schema';
import type { RoundData, SubmissionData } from '@/lib/game/types';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/lib/game/types';

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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedCardIds, setSubmittedCardIds] = useState<string[]>([]);

  // Reset submission state when round changes
  useEffect(() => {
    setHasSubmitted(false);
    setSubmittedCardIds([]);
    setSelectedCards([]);
  }, [currentRound.id]);

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
          setHasSubmitted(true);
          setSubmittedCardIds(selectedCards);
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Black Card */}
      <div className="flex justify-center">
        <div className="w-40 xs:w-48 sm:w-56 md:w-64 max-w-full">
          <MWHCard card={currentRound.blackCard} />
        </div>
      </div>

      {/* Czar View - Show Submissions */}
      {isCzar && submissions && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center">
            {t('game.selectWinner')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectWinner(sub.id)}
              >
                <CardContent className="p-3 sm:p-4 space-y-2">
                  {sub.cards.map((card) => (
                    <div key={card.id} className="w-full max-w-[200px] xs:max-w-xs mx-auto">
                      <MWHCard card={card} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Player View - Show Hand or Submitted Cards */}
      {!isCzar && (
        <div>
          {hasSubmitted ? (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center">
                {t('game.waitingForOthers')}
              </h2>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {myHand
                  .filter((card) => submittedCardIds.includes(card.id))
                  .map((card) => (
                    <div key={card.id} className="w-32 xs:w-36 sm:w-40 md:w-48">
                      <MWHCard card={card} />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {t('game.yourHand')}
                </h2>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    selectedCards.length !== currentRound.blackCard.pick
                  }
                  className="w-full sm:w-auto"
                >
                  {t('game.submitCards')}
                </Button>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                {myHand.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      if (selectedCards.includes(card.id)) {
                        setSelectedCards(
                          selectedCards.filter((id) => id !== card.id),
                        );
                      } else if (
                        selectedCards.length < currentRound.blackCard.pick
                      ) {
                        setSelectedCards([...selectedCards, card.id]);
                      }
                    }}
                    className={`transition-all w-full ${selectedCards.includes(card.id) ? 'ring-2 sm:ring-4 ring-blue-500 scale-95' : ''}`}
                  >
                    <MWHCard card={card} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
