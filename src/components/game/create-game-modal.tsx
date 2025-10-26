/**
 * Create Game Modal
 *
 * Modal for creating a new game. Asks for nickname and creates game session.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/lib/game/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface CreateGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socket: GameSocket | null;
}

export function CreateGameModal({
  open,
  onOpenChange,
  socket,
}: CreateGameModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useUser();

  const [nickname, setNickname] = useState(user?.firstName || '');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    // Require authentication to create a game
    if (!user) {
      toast.error(t('game.errors.loginRequired'));
      onOpenChange(false);
      router.push('/auth/sign-in');
      return;
    }

    if (!socket) {
      toast.error(t('game.errors.notConnected'));
      return;
    }

    if (!nickname.trim()) {
      toast.error(t('game.errors.nicknameRequired'));
      return;
    }

    setIsCreating(true);

    socket.emit(
      'create-game',
      {
        nickname: nickname.trim(),
        clerkUserId: user.id,
      },
      (response) => {
        setIsCreating(false);

        if (response.success && response.data) {
          toast.success(t('game.gameCreated'));
          router.push(`/game/${response.data.sessionId}`);
          onOpenChange(false);
        } else {
          toast.error(response.error?.message || t('game.errors.createFailed'));
        }
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('game.createGame')}</DialogTitle>
          <DialogDescription>
            {t('game.createGameDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">{t('game.nickname')}</Label>
            <Input
              id="nickname"
              placeholder={t('game.nicknamePlaceholder')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateGame();
                }
              }}
              maxLength={20}
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreateGame} disabled={isCreating || !socket}>
            {isCreating ? t('game.creating') : t('game.create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
