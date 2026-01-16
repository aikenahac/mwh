'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Layers, Share2, TrendingUp } from 'lucide-react';
import type { SystemStats } from '@/lib/api/analytics';

interface AnalyticsStatsCardsProps {
  stats: SystemStats;
}

export function AnalyticsStatsCards({ stats }: AnalyticsStatsCardsProps) {
  const userStatsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: 'Registered users',
      icon: Users,
      iconColor: 'text-blue-500',
    },
    {
      title: 'User Decks',
      value: stats.totalDecks.toLocaleString(),
      description: 'User-created decks',
      icon: Database,
      iconColor: 'text-green-500',
    },
    {
      title: 'User Cards',
      value: stats.totalCards.toLocaleString(),
      description: `${stats.totalWhiteCards} white, ${stats.totalBlackCards} black`,
      icon: Layers,
      iconColor: 'text-purple-500',
    },
    {
      title: 'Avg Cards/Deck',
      value: stats.avgCardsPerDeck.toFixed(1),
      description: 'Average cards per user deck',
      icon: TrendingUp,
      iconColor: 'text-orange-500',
    },
    {
      title: 'Total Shares',
      value: stats.totalShares.toLocaleString(),
      description: 'Deck shares',
      icon: Share2,
      iconColor: 'text-pink-500',
    },
  ];

  const systemStatsCards = [
    {
      title: 'System Decks',
      value: stats.systemDecks.toLocaleString(),
      description: 'System-wide decks',
      icon: Database,
      iconColor: 'text-cyan-500',
    },
    {
      title: 'System Cards',
      value: stats.systemCards.toLocaleString(),
      description: `${stats.systemWhiteCards} white, ${stats.systemBlackCards} black`,
      icon: Layers,
      iconColor: 'text-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">User Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {userStatsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">System Resources</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {systemStatsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
