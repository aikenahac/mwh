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

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border bg-muted/50">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">
            Create Your Own Card Game Experience
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
        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
          Design both question and answer cards just like the original game,
          then export them to PDF for professional printing
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-black text-white border-black shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-10 flex items-center justify-center min-h-[220px]">
              <div>
                <div className="text-sm font-semibold mb-3 text-white/60">
                  BLACK CARD
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  Create black question cards with custom text and Pick 2
                  options
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white text-black border-2 shadow-xl hover:shadow-2xl transition-shadow">
            <CardContent className="p-10 flex items-center justify-center min-h-[220px]">
              <div>
                <div className="text-sm font-semibold mb-3 text-black/60">
                  WHITE CARD
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  Design white answer cards with your own hilarious responses
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12">
          <Button asChild size="lg" variant="outline">
            <Link href={Routes.DECKS}>Start Creating Your Deck</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
