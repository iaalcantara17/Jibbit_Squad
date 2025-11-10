import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function CalendarCallback() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your calendar...');

  useEffect(() => {
    handleCallback();
  }, [user]);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      setMessage('Calendar connection was cancelled or failed');
      return;
    }

    if (!code || !state || !user) {
      setStatus('error');
      setMessage('Invalid callback parameters');
      return;
    }

    try {
      // Exchange code for tokens
      const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_SECRET;
      const redirectUri = `${window.location.origin}/calendar/callback`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();

      // Store tokens in database
      const { error: dbError } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: user.id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          sync_enabled: true,
        });

      if (dbError) throw dbError;

      setStatus('success');
      setMessage('Calendar connected successfully!');
      toast.success('Google Calendar connected');
      
      setTimeout(() => {
        navigate('/calendar-connect');
      }, 2000);
    } catch (error) {
      console.error('Calendar callback error:', error);
      setStatus('error');
      setMessage('Failed to connect calendar. Please try again.');
      toast.error('Failed to connect calendar');
    }
  };

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
      <Card className="p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            <p className="text-muted-foreground text-sm">This will only take a moment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">{message}</h2>
            <p className="text-muted-foreground text-sm mb-4">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">{message}</h2>
            <Button onClick={() => navigate('/calendar-connect')} className="mt-4">
              Try Again
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
