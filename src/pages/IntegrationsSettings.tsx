import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function IntegrationsSettings() {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [gmailLastSync, setGmailLastSync] = useState<string | null>(null);

  useEffect(() => {
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: emailIntegration } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    setGmailConnected(!!emailIntegration);

    const { data: calendarIntegration } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    setCalendarConnected(!!calendarIntegration);
  };

  const connectGmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('email-oauth-start');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to start Gmail OAuth:', error);
      toast.error("Failed to connect Gmail");
    }
  };

  const disconnectGmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('email_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;

      setGmailConnected(false);
      toast.success("Gmail disconnected");
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      toast.error("Failed to disconnect Gmail");
    }
  };

  const syncGmail = async () => {
    setGmailSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-poller');
      
      if (error) throw error;
      
      setGmailLastSync(new Date().toLocaleString());
      toast.success(`Synced ${data?.detectedCount || 0} job-related emails`);
    } catch (error) {
      console.error('Failed to sync Gmail:', error);
      toast.error("Failed to sync emails");
    } finally {
      setGmailSyncing(false);
    }
  };

  const connectCalendar = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-oauth-start');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to start Calendar OAuth:', error);
      toast.error("Failed to connect Calendar");
    }
  };

  const disconnectCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;

      setCalendarConnected(false);
      toast.success("Calendar disconnected");
    } catch (error) {
      console.error('Failed to disconnect Calendar:', error);
      toast.error("Failed to disconnect Calendar");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>

      <div className="space-y-6">
        {/* Gmail Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">Gmail</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically detect application status updates from emails
                </p>
              </div>
            </div>
            {gmailConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>

          {gmailLastSync && (
            <p className="text-sm text-muted-foreground mb-4">
              Last synced: {gmailLastSync}
            </p>
          )}

          <div className="flex gap-2">
            {gmailConnected ? (
              <>
                <Button onClick={syncGmail} disabled={gmailSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${gmailSyncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button onClick={disconnectGmail} variant="outline">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connectGmail}>
                Connect Gmail
              </Button>
            )}
          </div>
        </Card>

        {/* Google Calendar Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Sync interview schedules with your calendar
                </p>
              </div>
            </div>
            {calendarConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {calendarConnected ? (
              <Button onClick={disconnectCalendar} variant="outline">
                Disconnect
              </Button>
            ) : (
              <Button onClick={connectCalendar}>
                Connect Calendar
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
