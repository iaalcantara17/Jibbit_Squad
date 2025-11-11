import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTracking {
  id: string;
  email_subject: string;
  sender_email: string;
  detected_status: string;
  confidence_score: number;
  processed_at: string;
  job_id: string | null;
}

export function EmailStatusMonitor() {
  const [emails, setEmails] = useState<EmailTracking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmailTracking();
  }, []);

  const fetchEmailTracking = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('processed_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching email tracking:', error);
      return;
    }

    setEmails(data || []);
  };

  const checkEmails = async () => {
    // Check if email is connected first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    const { data: integration } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      toast.error("Please connect your email in Settings first", {
        action: {
          label: "Go to Settings",
          onClick: () => window.location.href = "/email-integration"
        }
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-poller', {
        body: {}
      });

      if (error) throw error;

      toast.success("Email check complete! Found " + (data?.emailsProcessed || 0) + " job-related emails");
      fetchEmailTracking();
    } catch (error: any) {
      console.error('Error checking emails:', error);
      toast.error(error.message || "Failed to check emails");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interview_scheduled':
        return 'default';
      case 'offer_received':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'application_received':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Status Monitor
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatically detect application status updates from your emails
          </p>
        </div>
        <Button onClick={checkEmails} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Check Emails
        </Button>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No email tracking data yet</p>
          <p className="text-sm">Click "Check Emails" to start monitoring</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <Card key={email.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(email.detected_status)}>
                      {getStatusLabel(email.detected_status)}
                    </Badge>
                    {email.confidence_score >= 0.8 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {(email.confidence_score * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate mb-1">
                    {email.email_subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From: {email.sender_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(email.processed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Email monitoring requires connecting your email account. 
          The system will automatically scan for job-related emails and update application statuses.
        </p>
      </div>
    </Card>
  );
}
