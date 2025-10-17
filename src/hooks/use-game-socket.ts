/**
 * Game Socket Hook
 *
 * Provides typed Socket.io connection and event handlers for the game.
 * Auto-connects on mount and provides utilities for emitting events.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/game/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useGameSocket() {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<GameSocket | null>(null);

  useEffect(() => {
    // Create socket connection
    const newSocket: GameSocket = io({
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
}

/**
 * Hook for managing game socket event listeners
 * Automatically handles cleanup
 */
export function useGameSocketListener<K extends keyof ServerToClientEvents>(
  socket: GameSocket | null,
  event: K,
  handler: ServerToClientEvents[K],
) {
  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler as any);

    return () => {
      socket.off(event, handler as any);
    };
  }, [socket, event, handler]);
}
