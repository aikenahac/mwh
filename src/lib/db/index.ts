import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Parse DATABASE_URL if needed
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a connection pool with explicit configuration
const pool = new Pool({
  connectionString,
  // Force password to be a string
  connectionTimeoutMillis: 5000,
});

// Create the drizzle instance with schema for relational queries
export const db = drizzle(pool, { schema });
