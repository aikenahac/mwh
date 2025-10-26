/**
 * Custom Next.js Server with Socket.io
 *
 * This custom server integrates Socket.io with Next.js 15.
 * It handles both HTTP requests (Next.js) and WebSocket connections (Socket.io).
 *
 * Run with: ts-node server.ts (dev) or node server.js (production)
 */

// Load environment variables only in development
// In production (Docker), env vars are provided by the container
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv');
  dotenv.config({ path: ['.env', 'stack.env'] });
}

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './src/lib/game/types';
import { attachGameHandlers } from './src/lib/game/socket-handlers';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Create Socket.io server
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : process.env.ALLOWED_ORIGINS?.split(',') || [],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Attach all game event handlers
    attachGameHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);
      // Note: Player reconnection is handled in socket-handlers.ts
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`[Socket.io] Socket error for ${socket.id}:`, error);
    });
  });

  // Start server
  httpServer
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🃏 Mess with Humanity Server                             │
│                                                             │
│   HTTP Server:      http://${hostname}:${port}               │
│   Socket.io Path:   /socket.io                             │
│   Environment:      ${dev ? 'development' : 'production'}                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
      `);
    });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    io.close(() => {
      console.log('[Socket.io] Closed all connections');
    });
    httpServer.close(() => {
      console.log('[HTTP] Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
