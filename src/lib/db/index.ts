import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Check if we're in a build environment (no DATABASE_URL needed during build)
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

// Parse DATABASE_URL if needed
const connectionString = process.env.DATABASE_URL;

if (!connectionString && !isBuild) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a connection pool with explicit configuration
// Only create the pool if not in build mode
const pool = !isBuild && connectionString
  ? new Pool({
      connectionString,
      // Force password to be a string
      connectionTimeoutMillis: 5000,
    })
  : null;

// Create the drizzle instance with schema for relational queries
// Use a dummy pool during build time
export const db = drizzle(pool as Pool, { schema });
