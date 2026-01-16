'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Legend,
  Tooltip,
} from 'recharts';
import type {
  UserGrowthData,
  DeckCreationTrend,
  CardCreationTrend,
  SharingActivityTrend,
} from '@/lib/api/analytics';

interface AnalyticsChartsProps {
  userGrowth: UserGrowthData[];
  deckTrends: DeckCreationTrend[];
  cardTrends: CardCreationTrend[];
  sharingTrends: SharingActivityTrend[];
}

export function AnalyticsCharts({
  userGrowth,
  deckTrends,
  cardTrends,
  sharingTrends,
}: AnalyticsChartsProps) {
  // User Growth Chart Config
  const userGrowthConfig = {
    users: {
      label: 'Users',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  // Deck Creation Chart Config
  const deckTrendsConfig = {
    decks: {
      label: 'Decks',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  // Card Distribution Config
  const cardDistributionData = cardTrends.reduce(
    (acc, trend) => {
      acc[0].value += trend.whiteCards;
      acc[1].value += trend.blackCards;
      return acc;
    },
    [
      { name: 'White Cards', value: 0, fill: 'var(--color-white)' },
      { name: 'Black Cards', value: 0, fill: 'var(--color-black)' },
    ]
  );

  const cardDistributionConfig = {
    white: {
      label: 'White Cards',
      color: 'hsl(var(--chart-3))',
    },
    black: {
      label: 'Black Cards',
      color: 'hsl(var(--chart-4))',
    },
  } satisfies ChartConfig;

  // Sharing Activity Config
  const sharingActivityConfig = {
    shares: {
      label: 'Shares',
      color: 'hsl(var(--chart-5))',
    },
  } satisfies ChartConfig;

  return (
    <>
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Cumulative user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={userGrowthConfig} className="min-h-[200px] w-full">
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Deck Creation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Deck Creation Trends</CardTitle>
          <CardDescription>Daily deck creation (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={deckTrendsConfig} className="min-h-[200px] w-full">
            <BarChart data={deckTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="decks" fill="var(--color-decks)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Card Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Card Type Distribution</CardTitle>
          <CardDescription>Total white vs black cards created</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cardDistributionConfig} className="min-h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={cardDistributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
              >
                <Cell fill="var(--color-white)" />
                <Cell fill="var(--color-black)" />
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sharing Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Sharing Activity</CardTitle>
          <CardDescription>Daily deck shares (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={sharingActivityConfig} className="min-h-[200px] w-full">
            <LineChart data={sharingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="shares"
                stroke="var(--color-shares)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}
