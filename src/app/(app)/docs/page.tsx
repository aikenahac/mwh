import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Routes } from '@/lib/routes';

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          📚 Documentation
        </h1>
        <p className="text-muted-foreground text-lg">
          Important legal documents and policies for Mess With Humanity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href={Routes.DOCS_PRIVACY_POLICY} className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 group-hover:text-primary transition-colors">
                <span className="text-2xl">🕵️</span>
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Learn about how we collect, use, and protect your personal data.
                Updated with GDPR compliance and our data handling practices.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={Routes.DOCS_TERMS_OF_SERVICE} className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 group-hover:text-primary transition-colors">
                <span className="text-2xl">⚖️</span>
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Review the terms and conditions for using Mess With Humanity,
                including user responsibilities and service limitations.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={Routes.SOURCE_CODE} target='_blank' className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 group-hover:text-primary transition-colors">
                <span className="text-2xl">💻</span>
                Source Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Review the source code for Mess With Humanity on GitHub.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-12 text-center">
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              For questions about these documents or our policies, contact us at{' '}
              <a
                href="mailto:info@gomwh.com"
                className="text-primary hover:underline font-medium"
              >
                info@gomwh.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
