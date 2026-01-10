import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Global is used to prevent hot-reloading from creating new connection pools
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

// Create a singleton connection pool with proper configuration
const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Maximum number of clients in the pool
    max: 10,
    // Maximum time a client can remain idle before being closed (30 seconds)
    idleTimeoutMillis: 30000,
    // Maximum time to wait for a connection (10 seconds)
    connectionTimeoutMillis: 10000,
    // Maximum lifetime of a connection in the pool (30 minutes)
    maxLifetimeSeconds: 1800,
    // Allow the pool to close idle connections
    allowExitOnIdle: false,
  });

// Store the pool globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

// Create the drizzle instance with schema for relational queries
export const db = drizzle(pool, { schema });
