import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if success parameter is present
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(error);
        }

        if (success === 'true') {
          setStatus('success');
          toast.success('Email connected successfully!');
          
          // Redirect to email integration page after 2 seconds
          setTimeout(() => {
            navigate('/email-integration');
          }, 2000);
        } else {
          throw new Error('OAuth callback did not complete successfully');
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        toast.error(error.message || 'Failed to connect email');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/email-integration');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">Connecting your email...</h2>
                <p className="text-muted-foreground">
                  Please wait while we complete the connection
                </p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h2 className="text-xl font-semibold">Email connected!</h2>
                <p className="text-muted-foreground">
                  Your email has been successfully connected. Redirecting...
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">Connection failed</h2>
                <p className="text-muted-foreground">
                  Failed to connect your email. Please try again.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
