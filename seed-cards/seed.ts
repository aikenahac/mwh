import decks from './cah-cards-full.json';
import { card, deck } from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';

// Create a connection pool
const pool = new Pool({
  connectionString: "postgres://postgres:postgres@localhost:5432/mwh",
});

// Create the drizzle instance with schema for relational queries
const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding database with values from cah...');

  decks.forEach(async (d) => {
    const [newDeck] = await db
      .insert(deck)
      .values({
        name: d.name,
        description: 'Deck from the official Cards Against Humanity set',
        userId: 'system',
      })
      .returning();

    d.white.forEach(async (c) => {
      await db.insert(card).values({
        text: c.text,
        type: 'white',
        deckId: newDeck.id,
        userId: 'system',
      });
    });

    d.black.forEach(async (c) => {
      await db.insert(card).values({
        text: c.text,
        type: 'black',
        pick: c.pick,
        deckId: newDeck.id,
        userId: 'system',
      });
    });
  });
}

seed();
