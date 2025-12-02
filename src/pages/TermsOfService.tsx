import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 container py-12 max-w-4xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Effective Date: December 2, 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using JibbitATS ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                JibbitATS is a job search management platform that helps users track job applications, 
                manage professional profiles, schedule interviews, and organize their career-related activities. 
                The Service includes features such as resume building, cover letter management, interview scheduling, 
                calendar integration, and networking tools.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">To use certain features of the Service, you must:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Create an account with accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Be at least 18 years old or have parental/guardian consent</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload false, misleading, or fraudulent information</li>
                <li>Attempt to gain unauthorized access to other users' accounts</li>
                <li>Interfere with or disrupt the Service or its servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Third-Party Integrations</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service integrates with third-party services including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Google Calendar:</strong> For syncing interview schedules</li>
                <li><strong>LinkedIn:</strong> For profile optimization features</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Your use of these integrations is subject to the respective third-party terms of service. 
                We are not responsible for the availability or functionality of third-party services. 
                You may disconnect these integrations at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by JibbitATS 
                and are protected by international copyright, trademark, and other intellectual property laws. 
                Content you create (such as resumes, cover letters, and notes) remains your property, and you 
                grant us a license to store and display it as necessary to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Service is also governed by our{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, 
                which describes how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, JibbitATS shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including without limitation, 
                loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                <li>Your access to or use of (or inability to access or use) the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Unauthorized access, use, or alteration of your content</li>
                <li>Failures or issues with third-party integrations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" and "as available" without warranties of any kind, 
                either express or implied. We do not guarantee that the Service will be uninterrupted, 
                secure, or error-free. We make no warranties regarding the accuracy or reliability of 
                any information obtained through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, 
                without prior notice or liability, for any reason, including breach of these Terms. 
                Upon termination, your right to use the Service will cease immediately. 
                You may also delete your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. We will provide 
                notice of any material changes by posting the new Terms on this page and updating the 
                effective date. Your continued use of the Service after such changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, 
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>Email:</strong> legal@jibbit.app
              </p>
            </section>
          </div>
        </Card>
      </main>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground space-y-2">
          <p>&copy; 2025 JibbitATS. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
