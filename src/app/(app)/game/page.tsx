/**
 * Game Entry Page
 *
 * Landing page for games where users can:
 * - Create a new game
 * - Join an existing game with code
 * - View their recent games
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useGameSocket } from '@/hooks/use-game-socket';
import { CreateGameModal } from '@/components/game/create-game-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, LogIn } from 'lucide-react';

export default function GamePage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useUser();
  const { socket, connected } = useGameSocket();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState(user?.firstName || '');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = () => {
    if (!socket) {
      toast.error(t('game.errors.notConnected'));
      return;
    }

    if (!joinCode.trim()) {
      toast.error(t('game.errors.joinCodeRequired'));
      return;
    }

    if (!nickname.trim()) {
      toast.error(t('game.errors.nicknameRequired'));
      return;
    }

    setIsJoining(true);

    socket.emit(
      'join-game',
      {
        joinCode: joinCode.trim().toUpperCase(),
        nickname: nickname.trim(),
        clerkUserId: user?.id || null,
      },
      (response) => {
        setIsJoining(false);

        if (response.success && response.data) {
          toast.success(t('game.joined'));

          // Store player ID in sessionStorage for reconnection
          const myPlayer = response.data.session.players[response.data.session.players.length - 1];
          if (myPlayer) {
            sessionStorage.setItem(`game_player_${response.data.session.id}`, myPlayer.id);
          }

          router.push(`/game/${response.data.session.id}`);
          setJoinModalOpen(false);
        } else {
          toast.error(response.error?.message || t('game.errors.joinFailed'));
        }
      },
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t('game.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('game.subtitle')}
          </p>
        </div>

        {/* Connection Status */}
        {!connected && (
          <Alert variant="default">
            <AlertDescription className="text-center">
              {t('game.connecting')}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Game */}
          <Card
            className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg disabled:opacity-50"
            onClick={() => connected && setCreateModalOpen(true)}
          >
            <CardContent className="flex flex-col items-center space-y-4 p-8">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold">{t('game.createGame')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('game.createGameDescription')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card
            className="cursor-pointer transition-all hover:border-green-500 hover:shadow-lg disabled:opacity-50"
            onClick={() => connected && setJoinModalOpen(true)}
          >
            <CardContent className="flex flex-col items-center space-y-4 p-8">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                <LogIn className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold">{t('game.joinGame')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('game.joinGameDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="flex justify-center gap-4 pt-8 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/game/history')}
          >
            {t('game.viewHistory')}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/game/leaderboard')}
          >
            {t('game.viewLeaderboard')}
          </Button>
        </div>
      </div>

      {/* Create Game Modal */}
      <CreateGameModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        socket={socket}
      />

      {/* Join Game Modal */}
      <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('game.joinGame')}</DialogTitle>
            <DialogDescription>
              {t('game.joinGameDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">{t('game.joinCode')}</Label>
              <Input
                id="join-code"
                placeholder={t('game.joinCodePlaceholder')}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                disabled={isJoining}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-nickname">{t('game.nickname')}</Label>
              <Input
                id="join-nickname"
                placeholder={t('game.nicknamePlaceholder')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinGame();
                  }
                }}
                maxLength={20}
                disabled={isJoining}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setJoinModalOpen(false)}
              disabled={isJoining}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleJoinGame}
              disabled={isJoining || !socket}
            >
              {isJoining ? t('game.joining') : t('game.join')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
