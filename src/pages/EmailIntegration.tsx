import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EmailIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectEmail = async () => {
    setIsConnecting(true);
    try {
      // Call the email OAuth start function
      const { data, error } = await supabase.functions.invoke('email-oauth-start', {
        body: {}
      });

      if (error) {
        if (error.message?.includes('OAUTH_NOT_CONFIGURED') || error.message?.includes('503')) {
          toast.error('Email integration is not configured. Please contact support.');
          return;
        }
        throw error;
      }

      if (data?.authUrl) {
        // Open OAuth flow in a popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          'EmailOAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth callback
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            checkConnectionStatus();
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Error connecting email:', error);
      toast.error(error.message || 'Failed to start email connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (!error && data) {
        setIsConnected(true);
        toast.success('Email connected successfully!');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Email Integration</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Connect your email to automatically track application status updates
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Gmail Integration
              </CardTitle>
              <CardDescription>
                Connect your Gmail account to enable automatic email monitoring for job application updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Google Gmail</h3>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleConnectEmail}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Gmail'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  What happens when you connect?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>We'll scan your inbox for job-related emails</li>
                  <li>AI will detect application status updates (interview invitations, rejections, etc.)</li>
                  <li>Job statuses in your tracker will be automatically updated</li>
                  <li>You'll receive notifications about important updates</li>
                  <li>We only read job-related emails - we never send emails on your behalf</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Privacy & Security</h4>
                <p className="text-sm text-muted-foreground">
                  We take your privacy seriously. We only request read-only access to your Gmail inbox
                  to scan for job application updates. Your email content is never stored permanently,
                  and we never send emails on your behalf. You can disconnect at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Monitoring Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Automatic Status Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    AI automatically detects status changes from recruiter emails
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Interview Scheduling</h4>
                  <p className="text-sm text-muted-foreground">
                    Detect interview invitations and automatically add to your calendar
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Smart Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about important application updates instantly
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Response Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Track response times and success rates by company
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
