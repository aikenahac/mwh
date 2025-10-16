import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';
import { db } from '@/lib/db';
import { deck } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SystemDecksTable } from './system-decks-table';

export default async function SystemDecksPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect(Routes.SIGN_IN);
  }

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    redirect(Routes.HOME);
  }

  // Fetch all system decks with their cards
  const systemDecks = await db.query.deck.findMany({
    where: eq(deck.userId, 'system'),
    with: {
      cards: true,
    },
    orderBy: (deck, { desc }) => [desc(deck.createdAt)],
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href={Routes.ADMIN}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Link>
        <h1 className="text-3xl font-bold mb-2">System Decks</h1>
        <p className="text-muted-foreground">
          Manage system-wide card decks. These decks are owned by the system.
          {systemDecks.length > 0 && (
            <span className="ml-2">
              ({systemDecks.length} deck{systemDecks.length !== 1 ? 's' : ''},{' '}
              {systemDecks.reduce((sum, d) => sum + d.cards.length, 0)} cards total)
            </span>
          )}
        </p>
      </div>

      {systemDecks.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No system decks found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SystemDecksTable decks={systemDecks} />
      )}
    </div>
  );
}
