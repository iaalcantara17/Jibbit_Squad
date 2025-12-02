import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2, 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to JibbitATS ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our job search management platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Employment history, education, skills, certifications, and other professional details you choose to add</li>
                <li><strong>Job Application Data:</strong> Information about jobs you're tracking, application statuses, interview schedules, and notes</li>
                <li><strong>Documents:</strong> Resumes, cover letters, and other documents you create or upload</li>
                <li><strong>Contact Information:</strong> Details about professional contacts you add to your network</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Google Calendar Integration</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you connect your Google Calendar to JibbitATS, we request access to the following scope:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>calendar.events:</strong> This allows us to create, update, and delete interview events on your primary calendar</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>We use this access solely to:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Create calendar events when you schedule interviews</li>
                <li>Update calendar events when you reschedule interviews</li>
                <li>Delete calendar events when you cancel interviews</li>
                <li>Set reminders for upcoming interviews</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>We do NOT:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Read your existing calendar events</li>
                <li>Access calendars other than your primary calendar</li>
                <li>Share your calendar data with third parties</li>
                <li>Use your calendar data for advertising or marketing purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and manage your job applications and interviews</li>
                <li>Sync interview schedules with your calendar</li>
                <li>Send you notifications and reminders about your job search activities</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure token storage for third-party integrations</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you services. 
                You can request deletion of your account and associated data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Revoke Access:</strong> Disconnect third-party integrations at any time through your account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service integrates with third-party services including Google Calendar and LinkedIn. 
                When you connect these services, their respective privacy policies also apply to the data 
                they collect and process. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>Email:</strong> privacy@jibbit.app
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
