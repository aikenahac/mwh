import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Routes } from '@/lib/routes';
import { getTranslations } from 'next-intl/server';
import {
  Layers,
  PenTool,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Cards Against Humanity Creator - Free Online Deck Builder',
  description:
    'Create custom Cards Against Humanity decks online for free. Design white answer cards and black question cards, print professional PDFs, and play with friends. Easy-to-use card game maker with unlimited custom decks.',
  keywords: [
    'custom cards against humanity',
    'cards against humanity creator',
    'custom card game',
    'card deck builder',
    'printable cards against humanity',
    'make custom cards',
    'create playing cards',
    'custom game cards online',
    'free card creator',
    'CAH custom cards',
  ],
  openGraph: {
    title: 'Custom Cards Against Humanity Creator - Free Online Deck Builder',
    description:
      'Create custom Cards Against Humanity decks online for free. Design white answer cards and black question cards, print professional PDFs, and play with friends.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const t = await getTranslations();

  const features = [
    {
      title: t('home.features.createDecks.title'),
      description: t('home.features.createDecks.description'),
      icon: Layers,
    },
    {
      title: t('home.features.customCards.title'),
      description: t('home.features.customCards.description'),
      icon: PenTool,
    },
    {
      title: t('home.features.printReady.title'),
      description: t('home.features.printReady.description'),
      icon: Printer,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Mess with Humanity',
    applicationCategory: 'GameApplication',
    description:
      'Create custom Cards Against Humanity decks with your own white answer cards and black question cards. Design, print, and play personalized card games with friends.',
    url: 'https://gomwh.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Create unlimited custom card decks',
      'Design white answer cards',
      'Design black question cards with Pick 2 options',
      'Generate print-ready PDF files',
      'Free online card creator',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border bg-muted/50">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">
            {t('home.hero.badge')}
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
          {t('home.hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href={Routes.DECKS}>
              {t('home.hero.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('home.features.title')}
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 w-fit rounded-lg bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Sample Cards Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-4">
          {t('home.howItWorks.title')}
        </h2>
        <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
          {t('home.howItWorks.description')}
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-black text-white border-black shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-10 flex items-center justify-center min-h-[220px]">
              <div>
                <div className="text-sm font-semibold mb-3 text-white/60">
                  {t('home.howItWorks.blackCard.label')}
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  {t('home.howItWorks.blackCard.description')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black border-2 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-10 flex items-center justify-center min-h-[220px]">
              <div>
                <div className="text-sm font-semibold mb-3 text-black/60">
                  {t('home.howItWorks.whiteCard.label')}
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  {t('home.howItWorks.whiteCard.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12">
          <Button asChild size="lg" variant="outline">
            <Link href={Routes.DECKS}>
              {t('home.howItWorks.cta')}
            </Link>
          </Button>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="mt-20 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t('home.seo.h2')}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {t('home.seo.description')}
        </p>
      </section>
      </div>
    </>
  );
}
