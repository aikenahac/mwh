import { Card } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <Card className="w-full flex items-center justify-center">
      <h1>{t('home.title')}</h1>
    </Card>
  );
}
