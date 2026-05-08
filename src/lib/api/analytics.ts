import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { deck, card, deckShare } from '@/lib/db/schema';
import { sql, eq, and, ne, count } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

const ANALYTICS_REVALIDATE = 300; // 5 minutes
const ANALYTICS_TAG = 'analytics';

// Zod Schemas
export const systemStatsSchema = z.object({
  totalUsers: z.number(),
  totalDecks: z.number(),
  totalCards: z.number(),
  totalWhiteCards: z.number(),
  totalBlackCards: z.number(),
  totalShares: z.number(),
  avgCardsPerDeck: z.number(),
  systemDecks: z.number(),
  systemCards: z.number(),
  systemWhiteCards: z.number(),
  systemBlackCards: z.number(),
});

export const userGrowthDataSchema = z.object({
  month: z.string(),
  users: z.number(),
});

export const deckCreationTrendSchema = z.object({
  date: z.string(),
  decks: z.number(),
});

export const cardCreationTrendSchema = z.object({
  date: z.string(),
  whiteCards: z.number(),
  blackCards: z.number(),
});

export const sharingActivityTrendSchema = z.object({
  date: z.string(),
  shares: z.number(),
});

export const userDeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  cardCount: z.number(),
});

export const userActivitySchema = z.object({
  userId: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string(),
  deckCount: z.number(),
  totalCards: z.number(),
  whiteCards: z.number(),
  blackCards: z.number(),
  sharesSent: z.number(),
  sharesReceived: z.number(),
  lastActivity: z.string().nullable(),
  joinDate: z.string(),
  decks: z.array(userDeckSchema),
});

// Type exports
export type SystemStats = z.infer<typeof systemStatsSchema>;
export type UserGrowthData = z.infer<typeof userGrowthDataSchema>;
export type DeckCreationTrend = z.infer<typeof deckCreationTrendSchema>;
export type CardCreationTrend = z.infer<typeof cardCreationTrendSchema>;
export type SharingActivityTrend = z.infer<typeof sharingActivityTrendSchema>;
export type UserActivity = z.infer<typeof userActivitySchema>;
export type UserDeck = z.infer<typeof userDeckSchema>;

/**
 * Get system-wide statistics
 */
async function _getSystemStats(): Promise<SystemStats> {
  // Aggregate all deck counts in a single query using FILTER
  const [deckRow] = await db
    .select({
      userDecks: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} <> 'system')`,
      systemDecks: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} = 'system')`,
    })
    .from(deck);

  // Aggregate all card counts in a single query using FILTER
  const [cardRow] = await db
    .select({
      userTotal: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} <> 'system')`,
      userWhite: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} <> 'system' AND ${card.type} = 'white')`,
      userBlack: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} <> 'system' AND ${card.type} = 'black')`,
      systemTotal: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} = 'system')`,
      systemWhite: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} = 'system' AND ${card.type} = 'white')`,
      systemBlack: sql<string>`COUNT(*) FILTER (WHERE ${deck.userId} = 'system' AND ${card.type} = 'black')`,
    })
    .from(card)
    .innerJoin(deck, eq(card.deckId, deck.id));

  const [shareCount] = await db.select({ count: count() }).from(deckShare);

  // Get Clerk users count (lightweight: limit 1, totalCount comes from headers)
  const client = await clerkClient();
  const usersResponse = await client.users.getUserList({ limit: 1 });
  const totalUsers = usersResponse.totalCount;

  const userDecks = Number(deckRow.userDecks);
  const userCards = Number(cardRow.userTotal);
  const avgCardsPerDeck = userDecks > 0 ? userCards / userDecks : 0;

  return systemStatsSchema.parse({
    totalUsers,
    totalDecks: userDecks,
    totalCards: userCards,
    totalWhiteCards: Number(cardRow.userWhite),
    totalBlackCards: Number(cardRow.userBlack),
    totalShares: shareCount.count,
    avgCardsPerDeck: Math.round(avgCardsPerDeck * 10) / 10,
    systemDecks: Number(deckRow.systemDecks),
    systemCards: Number(cardRow.systemTotal),
    systemWhiteCards: Number(cardRow.systemWhite),
    systemBlackCards: Number(cardRow.systemBlack),
  });
}

export const getSystemStats = unstable_cache(_getSystemStats, ['analytics:system-stats'], {
  revalidate: ANALYTICS_REVALIDATE,
  tags: [ANALYTICS_TAG],
});

/**
 * Get user growth by month
 */
async function _getUserGrowthByMonth(): Promise<Array<UserGrowthData>> {
  const client = await clerkClient();
  const allUsersResponse = await client.users.getUserList({ limit: 500 });
  const allUsers = allUsersResponse.data;

  // Group by month
  const monthMap = new Map<string, number>();

  allUsers.forEach((user) => {
    const date = new Date(user.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
  });

  // Convert to cumulative growth
  const sortedMonths = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  const result: Array<UserGrowthData> = sortedMonths.map(([month, count]) => {
    cumulative += count;
    return { month, users: cumulative };
  });

  return z.array(userGrowthDataSchema).parse(result);
}

export const getUserGrowthByMonth = unstable_cache(
  _getUserGrowthByMonth,
  ['analytics:user-growth-by-month'],
  { revalidate: ANALYTICS_REVALIDATE, tags: [ANALYTICS_TAG] },
);

/**
 * Get deck creation trends (last 30 days)
 */
async function _getDeckCreationTrends(): Promise<Array<DeckCreationTrend>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trends = await db
    .select({
      date: sql<string>`DATE(${deck.createdAt})`,
      count: count(),
    })
    .from(deck)
    .where(and(
      sql`${deck.createdAt} >= ${thirtyDaysAgo}`,
      ne(deck.userId, 'system')
    ))
    .groupBy(sql`DATE(${deck.createdAt})`)
    .orderBy(sql`DATE(${deck.createdAt})`);

  const result = trends.map((t) => ({
    date: t.date,
    decks: t.count,
  }));

  return z.array(deckCreationTrendSchema).parse(result);
}

export const getDeckCreationTrends = unstable_cache(
  _getDeckCreationTrends,
  ['analytics:deck-creation-trends'],
  { revalidate: ANALYTICS_REVALIDATE, tags: [ANALYTICS_TAG] },
);

/**
 * Get card creation trends by type (last 30 days)
 */
async function _getCardCreationTrends(): Promise<Array<CardCreationTrend>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trends = await db
    .select({
      date: sql<string>`DATE(${card.createdAt})`,
      type: card.type,
      count: count(),
    })
    .from(card)
    .innerJoin(deck, eq(card.deckId, deck.id))
    .where(and(
      sql`${card.createdAt} >= ${thirtyDaysAgo}`,
      ne(deck.userId, 'system')
    ))
    .groupBy(sql`DATE(${card.createdAt})`, card.type)
    .orderBy(sql`DATE(${card.createdAt})`);

  // Transform into the desired format
  const dateMap = new Map<string, { whiteCards: number; blackCards: number }>();

  trends.forEach((t) => {
    if (!dateMap.has(t.date)) {
      dateMap.set(t.date, { whiteCards: 0, blackCards: 0 });
    }
    const entry = dateMap.get(t.date)!;
    if (t.type === 'white') {
      entry.whiteCards = t.count;
    } else if (t.type === 'black') {
      entry.blackCards = t.count;
    }
  });

  const result = Array.from(dateMap.entries())
    .map(([date, counts]) => ({
      date,
      whiteCards: counts.whiteCards,
      blackCards: counts.blackCards,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return z.array(cardCreationTrendSchema).parse(result);
}

export const getCardCreationTrends = unstable_cache(
  _getCardCreationTrends,
  ['analytics:card-creation-trends'],
  { revalidate: ANALYTICS_REVALIDATE, tags: [ANALYTICS_TAG] },
);

/**
 * Get sharing activity trends (last 30 days)
 */
async function _getSharingActivityTrends(): Promise<Array<SharingActivityTrend>> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trends = await db
    .select({
      date: sql<string>`DATE(${deckShare.createdAt})`,
      count: count(),
    })
    .from(deckShare)
    .where(sql`${deckShare.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(sql`DATE(${deckShare.createdAt})`)
    .orderBy(sql`DATE(${deckShare.createdAt})`);

  const result = trends.map((t) => ({
    date: t.date,
    shares: t.count,
  }));

  return z.array(sharingActivityTrendSchema).parse(result);
}

export const getSharingActivityTrends = unstable_cache(
  _getSharingActivityTrends,
  ['analytics:sharing-activity-trends'],
  { revalidate: ANALYTICS_REVALIDATE, tags: [ANALYTICS_TAG] },
);

/**
 * Get detailed user activity data
 */
async function _getUserActivityData(): Promise<Array<UserActivity>> {
  // Fetch all users from Clerk
  const client = await clerkClient();
  const allUsersResponse = await client.users.getUserList({ limit: 500 });
  const allUsers = allUsersResponse.data;

  // Fetch deck counts per user
  const deckCounts = await db
    .select({
      userId: deck.userId,
      deckCount: count(),
      lastDeckCreated: sql<Date>`MAX(${deck.createdAt})`,
    })
    .from(deck)
    .where(ne(deck.userId, 'system'))
    .groupBy(deck.userId);

  // Fetch card counts per user (excluding system decks)
  const cardCounts = await db
    .select({
      userId: card.userId,
      totalCards: count(),
      whiteCards: sql<number>`COUNT(CASE WHEN ${card.type} = 'white' THEN 1 END)`,
      blackCards: sql<number>`COUNT(CASE WHEN ${card.type} = 'black' THEN 1 END)`,
      lastCardCreated: sql<Date>`MAX(${card.createdAt})`,
    })
    .from(card)
    .innerJoin(deck, eq(card.deckId, deck.id))
    .where(ne(deck.userId, 'system'))
    .groupBy(card.userId);

  // Fetch shares sent
  const sharesSent = await db
    .select({
      userId: deckShare.sharedByUserId,
      shareCount: count(),
    })
    .from(deckShare)
    .groupBy(deckShare.sharedByUserId);

  // Fetch shares received
  const sharesReceived = await db
    .select({
      userId: deckShare.sharedWithUserId,
      shareCount: count(),
    })
    .from(deckShare)
    .groupBy(deckShare.sharedWithUserId);

  // Fetch user decks with card counts
  const userDecksWithCards = await db
    .select({
      userId: deck.userId,
      deckId: deck.id,
      deckName: deck.name,
      cardCount: count(card.id),
    })
    .from(deck)
    .leftJoin(card, eq(card.deckId, deck.id))
    .where(ne(deck.userId, 'system'))
    .groupBy(deck.userId, deck.id, deck.name);

  // Index all arrays by userId for O(1) lookups instead of O(n) per user
  const deckCountMap = new Map(deckCounts.map((d) => [d.userId, d]));
  const cardCountMap = new Map(cardCounts.map((c) => [c.userId, c]));
  const sharesSentMap = new Map(sharesSent.map((s) => [s.userId, s]));
  const sharesReceivedMap = new Map(sharesReceived.map((r) => [r.userId, r]));
  const userDecksMap = new Map<string, typeof userDecksWithCards>();
  for (const ud of userDecksWithCards) {
    if (!userDecksMap.has(ud.userId)) userDecksMap.set(ud.userId, []);
    userDecksMap.get(ud.userId)!.push(ud);
  }

  // Build user activity data
  const userActivity: Array<UserActivity> = allUsers.map((user) => {
    const deckData = deckCountMap.get(user.id);
    const cardData = cardCountMap.get(user.id);
    const sentData = sharesSentMap.get(user.id);
    const receivedData = sharesReceivedMap.get(user.id);

    // Get user's decks
    const userDecks = (userDecksMap.get(user.id) ?? []).map((ud) => ({
      id: ud.deckId,
      name: ud.deckName,
      cardCount: ud.cardCount,
    }));

    // Determine last activity
    let lastActivity: Date | null = null;
    if (deckData?.lastDeckCreated) {
      const deckDate = new Date(deckData.lastDeckCreated);
      lastActivity = deckDate;
    }
    if (cardData?.lastCardCreated) {
      const cardDate = new Date(cardData.lastCardCreated);
      if (!lastActivity || cardDate > lastActivity) {
        lastActivity = cardDate;
      }
    }

    return {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress || 'No email',
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      deckCount: deckData?.deckCount || 0,
      totalCards: cardData?.totalCards || 0,
      whiteCards: Number(cardData?.whiteCards) || 0,
      blackCards: Number(cardData?.blackCards) || 0,
      sharesSent: sentData?.shareCount || 0,
      sharesReceived: receivedData?.shareCount || 0,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
      joinDate: new Date(user.createdAt).toISOString(),
      decks: userDecks,
    };
  });

  // Sort by most active (deck count + card count)
  userActivity.sort((a, b) => {
    const aActivity = a.deckCount + a.totalCards;
    const bActivity = b.deckCount + b.totalCards;
    return bActivity - aActivity;
  });

  return z.array(userActivitySchema).parse(userActivity);
}

export const getUserActivityData = unstable_cache(
  _getUserActivityData,
  ['analytics:user-activity-data'],
  { revalidate: ANALYTICS_REVALIDATE, tags: [ANALYTICS_TAG] },
);
