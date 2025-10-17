import { Routes } from '@/lib/routes';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function Footer() {
  const t = await getTranslations();

  return (
    <footer className="border-t mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              {t('footer.copyright', {
                year: new Date().getFullYear(),
                appName: t('appName'),
              })}
            </p>
          </div>
          <nav className="flex gap-6">
            <Link
              href={Routes.SOURCE_CODE}
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('footer.source')}
            </Link>
            <Link
              href={Routes.DOCS_PRIVACY_POLICY}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('footer.privacyPolicy')}
            </Link>
            <Link
              href={Routes.DOCS_TERMS_OF_SERVICE}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('footer.termsOfService')}
            </Link>
            <Link
              href={Routes.DOCS}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('footer.documents')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
