import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { Routes } from '@/lib/routes';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  getSystemStats,
  getUserGrowthByMonth,
  getDeckCreationTrends,
  getCardCreationTrends,
  getSharingActivityTrends,
  getUserActivityData,
} from '@/lib/api/analytics';
import { AnalyticsStatsCards } from './analytics-stats-cards';
import { AnalyticsCharts } from './analytics-charts';
import { UserActivityTable } from './user-activity-table';

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect(Routes.SIGN_IN);
  }

  const isAdmin = await isSuperAdmin(userId);

  if (!isAdmin) {
    redirect(Routes.HOME);
  }

  // Fetch all analytics data in parallel
  const [systemStats, userGrowth, deckTrends, cardTrends, sharingTrends, userActivity] =
    await Promise.all([
      getSystemStats(),
      getUserGrowthByMonth(),
      getDeckCreationTrends(),
      getCardCreationTrends(),
      getSharingActivityTrends(),
      getUserActivityData(),
    ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Link
          href={Routes.ADMIN}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">System-wide trends and user activity</p>
          </div>
        </div>
      </div>

      {/* System Stats Cards */}
      <AnalyticsStatsCards stats={systemStats} />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsCharts
          userGrowth={userGrowth}
          deckTrends={deckTrends}
          cardTrends={cardTrends}
          sharingTrends={sharingTrends}
        />
      </div>

      {/* User Activity Table */}
      <UserActivityTable data={userActivity} />
    </div>
  );
}
