import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl overflow-x-hidden">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold flex items-center justify-center gap-2">
            🕵️ Privacy Policy
          </CardTitle>
          <div className="text-muted-foreground space-y-1">
            <p>Effective Date: October 16, 2025</p>
            <p>Last Updated: October 16, 2025</p>
          </div>
        </CardHeader>

        <CardContent className="prose prose-slate dark:prose-invert prose-lg w-full overflow-x-auto">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
            <p className="mb-4">
              Mess With Humanity (&quot;the App&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated and
              distributed by Aerio, Aiken Tine Ahac s.p., registered in Slovenia
              (EU).
            </p>
            <p className="mb-4">
              If you have any questions, contact us at:
              <br />
              📧{' '}
              <a
                href="mailto:info@gomwh.com"
                className="text-primary hover:underline"
              >
                info@gomwh.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. What We Collect</h2>

            <h3 className="text-xl font-medium mb-3">a. Account Information</h3>
            <p className="mb-4">
              We use Clerk as our authentication provider. When you sign up or
              log in, Clerk collects and stores information such as your:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>
                Email address (and/or identity provider info, e.g. Google,
                GitHub, etc.)
              </li>
              <li>Display name or profile image (if provided)</li>
              <li>Authentication tokens and session data</li>
            </ul>
            <p className="mb-4">
              This information is used solely for login, user management, and
              account security. Clerk acts as a data processor under our
              control. For more info, check{' '}
              <a
                href="https://clerk.com/privacy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Clerk&apos;s privacy policy
              </a>
              .
            </p>

            <h3 className="text-xl font-medium mb-3">b. Analytics Data</h3>
            <p className="mb-4">
              We use a self-hosted instance of Plausible Analytics, hosted in
              the European Union, to collect privacy-friendly, aggregated usage
              data. Plausible does not use cookies or track individual users.
              The data collected includes:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Page URL</li>
              <li>Referrer</li>
              <li>Browser type</li>
              <li>Device type</li>
              <li>Country (approximate, based on IP, not stored long-term)</li>
            </ul>
            <p className="mb-4">
              All analytics data is anonymous and never linked to your account
              or identity.
            </p>

            <h3 className="text-xl font-medium mb-3">
              c. Optional Data You Provide
            </h3>
            <p className="mb-4">
              If the app allows submissions, uploads, or user-generated content,
              we&apos;ll store that data for the purpose of displaying and
              maintaining the app&apos;s functionality. You can delete your content
              or request removal at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Data
            </h2>
            <p className="mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Provide secure authentication and account access</li>
              <li>Improve and monitor app performance</li>
              <li>Maintain legal compliance and security</li>
              <li>Respond to support requests</li>
            </ul>
            <p className="mb-4">
              We don&apos;t sell, rent, or share your data with third parties for
              advertising or marketing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Data Storage and Security
            </h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                Clerk manages authentication data in compliance with GDPR and
                other relevant frameworks.
              </li>
              <li>
                Our Plausible instance is hosted in the EU, and all data remains
                in the EU.
              </li>
              <li>
                We apply reasonable security measures to protect data from
                unauthorized access, loss, or misuse.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Your Rights (GDPR)
            </h2>
            <p className="mb-4">
              If you are located in the EU or EEA, you have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Access the data we hold about you</li>
              <li>Request correction or deletion</li>
              <li>Withdraw consent (if applicable)</li>
              <li>Lodge a complaint with your local data authority</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us at {' '}
              <a
                href="mailto:info@gomwh.com"
                className="text-primary hover:underline"
              >
                info@gomwh.com
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>
                We retain user data for as long as your account is active or as
                needed to provide services.
              </li>
              <li>
                You can delete your account at any time through the app or by
                contacting us.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Updates to This Policy
            </h2>
            <p className="mb-4">
              We may update this Privacy Policy occasionally. Updates will be
              posted here with a revised &quot;Effective Date.&quot; Continued use of the
              app means you accept the changes.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
