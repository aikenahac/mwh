import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl overflow-x-hidden">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold flex items-center justify-center gap-2">
            ⚖️ Terms of Service
          </CardTitle>
          <div className="text-muted-foreground space-y-1">
            <p>Effective Date: October 16, 2025</p>
            <p>Last Updated: October 16, 2025</p>
          </div>
        </CardHeader>

        <CardContent className="prose prose-slate dark:prose-invert prose-lg w-full overflow-x-auto">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p>
              By accessing or using Mess With Humanity, you agree to these Terms
              of Service (&quot;Terms&quot;). If you don&apos;t agree,
              don&apos;t use the app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
            <p>
              You must be at least 16 years old (or older if required by local
              law) to use this app. By using the app, you confirm that you meet
              this age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You must create an account via Clerk to use certain features.
              </li>
              <li>
                You are responsible for keeping your account secure and for all
                activity under it.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that
                violate these Terms or applicable law.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the app for unlawful or abusive purposes</li>
              <li>Interfere with or disrupt the app&apos;s operation</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Upload or post harmful, illegal, or infringing content</li>
            </ul>
            <p className="mt-4">
              We can remove or restrict content at our discretion if it violates
              these rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property
            </h2>
            <p>
              All content, design, and software related to Mess With Humanity
              are owned or licensed by Aerio, Aiken Tine Ahac s.p. You retain
              ownership of any content you create or upload but grant us a
              limited license to display and distribute it within the app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may stop using the app anytime.</li>
              <li>
                We may suspend or terminate your account if you breach these
                Terms or misuse the service.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The app is provided &quot;as is&quot; without warranties of any
                kind.
              </li>
              <li>
                We don&apos;t guarantee uptime, availability, or that the app
                will be error-free.
              </li>
              <li>Use the app at your own risk.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Limitation of Liability
            </h2>
            <p className="mb-4">
              To the fullest extent permitted by law, Aerio, Aiken Tine Ahac
              s.p. is not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Data loss or service interruptions</li>
              <li>Content created or shared by users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                These Terms are governed by the laws of Slovenia and the
                European Union.
              </li>
              <li>Any disputes shall be handled in Slovenian courts.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Changes to These Terms
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We may update these Terms at any time.</li>
              <li>
                The updated version will be posted here, and continued use means
                you accept the new version.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
            <p>
              For any questions or concerns about these Terms or the Privacy
              Policy, contact:
            </p>
            <p className="mt-2">
              📧{' '}
              <a
                href="mailto:info@gomwh.com"
                className="text-primary hover:underline"
              >
                info@gomwh.com
              </a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
