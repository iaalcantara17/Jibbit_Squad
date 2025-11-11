import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function CalendarConnect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      setConnected(!!data?.access_token);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    } finally {
      setChecking(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setLoading(true);
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
      const redirectUri = `${window.location.origin}/calendar/callback`;
      
      if (!clientId) {
        toast.error('Google Calendar is not configured');
        return;
      }

      const scope = 'https://www.googleapis.com/auth/calendar';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${user?.id}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast.error('Failed to connect calendar');
      setLoading(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;

      setConnected(false);
      toast.success('Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  if (checking) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/jobs')}>
          ← Back to Jobs
        </Button>
      </div>

      <Card className="p-6">
        <div className="text-center mb-6">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Calendar Integration</h1>
          <p className="text-muted-foreground">
            Sync your interviews with Google Calendar
          </p>
        </div>

        {connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-600 dark:text-green-400">
                Google Calendar Connected
              </span>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ Interviews automatically synced to your calendar</p>
              <p>✓ Email reminders 24 hours before interviews</p>
              <p>✓ Popup reminders 1 hour before</p>
            </div>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={disconnectCalendar}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Connect your Google Calendar to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Automatically add interview events</li>
                <li>Get reminders before interviews</li>
                <li>Sync interview times and locations</li>
                <li>Never miss an important meeting</li>
              </ul>
            </div>

            <Button 
              className="w-full" 
              onClick={connectGoogleCalendar}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
