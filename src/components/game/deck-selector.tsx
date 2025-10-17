/**
 * Deck Selector Component
 *
 * Allows game owner to select which decks to play with.
 * Shows system decks and user's own decks separately.
 * Owner-only component.
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { DeckInfo, SelectedDecksInfo } from '@/lib/game/types';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/game/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface DeckSelectorProps {
  sessionId: string;
  socket: GameSocket | null;
  selectedDeckIds: string[];
  onDecksUpdated?: (info: SelectedDecksInfo) => void;
}

export function DeckSelector({
  sessionId,
  socket,
  selectedDeckIds,
  onDecksUpdated,
}: DeckSelectorProps) {
  const t = useTranslations();
  const { user } = useUser();

  const [systemDecks, setSystemDecks] = useState<DeckInfo[]>([]);
  const [userDecks, setUserDecks] = useState<DeckInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedDeckIds),
  );
  const [updating, setUpdating] = useState(false);
  const [isSystemDecksExpanded, setIsSystemDecksExpanded] = useState(false);

  const INITIAL_SYSTEM_DECKS_DISPLAY = 6;

  // Fetch available decks
  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `/api/game/decks/available?userId=${user.id}`,
        );
        const data = await response.json();

        if (data.success) {
          setSystemDecks(data.data.systemDecks || []);
          setUserDecks(data.data.userDecks || []);
        }
      } catch (error) {
        console.error('[DeckSelector] Error fetching decks:', error);
        toast.error(t('game.errors.fetchDecksFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [user, t]);

  const handleToggleDeck = (deckId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(deckId)) {
      newSelected.delete(deckId);
    } else {
      newSelected.add(deckId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAllSystem = () => {
    const newSelected = new Set(selectedIds);
    const allSystemSelected = systemDecks.every((d) => newSelected.has(d.id));

    if (allSystemSelected) {
      // Deselect all system
      systemDecks.forEach((d) => newSelected.delete(d.id));
    } else {
      // Select all system
      systemDecks.forEach((d) => newSelected.add(d.id));
    }

    setSelectedIds(newSelected);
  };

  const handleSelectAllUser = () => {
    const newSelected = new Set(selectedIds);
    const allUserSelected = userDecks.every((d) => newSelected.has(d.id));

    if (allUserSelected) {
      // Deselect all user
      userDecks.forEach((d) => newSelected.delete(d.id));
    } else {
      // Select all user
      userDecks.forEach((d) => newSelected.add(d.id));
    }

    setSelectedIds(newSelected);
  };

  const handleUpdateDecks = () => {
    if (!socket) {
      toast.error(t('game.errors.notConnected'));
      return;
    }

    if (selectedIds.size === 0) {
      toast.error(t('game.errors.noDeck sSelected'));
      return;
    }

    setUpdating(true);

    socket.emit(
      'update-decks',
      {
        sessionId,
        deckIds: Array.from(selectedIds),
        clerkUserId: user?.id || null,
      },
      (response) => {
        setUpdating(false);

        if (response.success && response.data) {
          toast.success(t('game.decksUpdated'));
          onDecksUpdated?.(response.data);
        } else {
          toast.error(
            response.error?.message || t('game.errors.updateDecksFailed'),
          );
        }
      },
    );
  };

  const totalBlack = Array.from(selectedIds).reduce((sum, id) => {
    const deck =
      systemDecks.find((d) => d.id === id) ||
      userDecks.find((d) => d.id === id);
    return sum + (deck?.blackCardCount || 0);
  }, 0);

  const totalWhite = Array.from(selectedIds).reduce((sum, id) => {
    const deck =
      systemDecks.find((d) => d.id === id) ||
      userDecks.find((d) => d.id === id);
    return sum + (deck?.whiteCardCount || 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary and Update Button - Moved to top */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t('game.selected')}: {selectedIds.size}{' '}
                {selectedIds.size === 1 ? t('game.deck') : t('game.decks')}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {totalBlack} {t('game.black')}
                </Badge>
                <Badge variant="outline">
                  {totalWhite} {t('game.white')}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            onClick={handleUpdateDecks}
            disabled={updating || selectedIds.size === 0 || !socket}
            className="w-full"
          >
            {updating ? t('game.updating') : t('game.updateDecks')}
          </Button>
        </CardContent>
      </Card>

      {/* System Decks - Compact View */}
      {systemDecks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t('game.systemDecks')} ({systemDecks.filter(d => selectedIds.has(d.id)).length}/{systemDecks.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAllSystem}
              className="text-xs"
            >
              {systemDecks.every((d) => selectedIds.has(d.id))
                ? t('game.deselectAll')
                : t('game.selectAll')}
            </Button>
          </div>

          {/* Compact grid view for initial decks */}
          <div className="grid grid-cols-2 gap-2">
            {systemDecks.slice(0, INITIAL_SYSTEM_DECKS_DISPLAY).map((deck) => (
              <Card
                key={deck.id}
                className={`cursor-pointer transition-colors ${
                  selectedIds.has(deck.id) ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleToggleDeck(deck.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={`deck-${deck.id}`}
                      checked={selectedIds.has(deck.id)}
                      onCheckedChange={() => handleToggleDeck(deck.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`deck-${deck.id}`}
                        className="text-sm font-medium cursor-pointer leading-tight line-clamp-2"
                      >
                        {deck.name}
                      </Label>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {deck.blackCardCount}B
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {deck.whiteCardCount}W
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Collapsible section for remaining decks */}
          {systemDecks.length > INITIAL_SYSTEM_DECKS_DISPLAY && (
            <Collapsible open={isSystemDecksExpanded} onOpenChange={setIsSystemDecksExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  {isSystemDecksExpanded ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Show Less ({systemDecks.length - INITIAL_SYSTEM_DECKS_DISPLAY} hidden)
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Show More ({systemDecks.length - INITIAL_SYSTEM_DECKS_DISPLAY} more)
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid grid-cols-2 gap-2">
                  {systemDecks.slice(INITIAL_SYSTEM_DECKS_DISPLAY).map((deck) => (
                    <Card
                      key={deck.id}
                      className={`cursor-pointer transition-colors ${
                        selectedIds.has(deck.id) ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleToggleDeck(deck.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`deck-${deck.id}`}
                            checked={selectedIds.has(deck.id)}
                            onCheckedChange={() => handleToggleDeck(deck.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`deck-${deck.id}`}
                              className="text-sm font-medium cursor-pointer leading-tight line-clamp-2"
                            >
                              {deck.name}
                            </Label>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {deck.blackCardCount}B
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {deck.whiteCardCount}W
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* User Decks */}
      {userDecks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('game.myDecks')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAllUser}
              className="text-xs"
            >
              {userDecks.every((d) => selectedIds.has(d.id))
                ? t('game.deselectAll')
                : t('game.selectAll')}
            </Button>
          </div>

          <div className="space-y-2">
            {userDecks.map((deck) => (
              <Card key={deck.id}>
                <CardContent className="flex items-start space-x-3 p-3">
                  <Checkbox
                    id={`deck-${deck.id}`}
                    checked={selectedIds.has(deck.id)}
                    onCheckedChange={() => handleToggleDeck(deck.id)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`deck-${deck.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {deck.name}
                      </Label>
                      {deck.sharedBy && (
                        <Badge variant="outline" className="text-xs">
                          {t('game.sharedBy')} {deck.sharedBy}
                        </Badge>
                      )}
                    </div>
                    {deck.description && (
                      <p className="text-xs text-muted-foreground">
                        {deck.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {deck.blackCardCount} {t('game.black')}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {deck.whiteCardCount} {t('game.white')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
