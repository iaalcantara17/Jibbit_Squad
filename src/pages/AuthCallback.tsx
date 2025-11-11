import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const searchParams = url.searchParams;

    const error = searchParams.get('error') || hashParams.get('error');
    const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

    // Clean sensitive params from URL immediately
    window.history.replaceState({}, document.title, window.location.pathname);

    if (error) {
      toast.error(decodeURIComponent(errorDescription || 'Authentication failed'));
      navigate('/login', { replace: true });
      return;
    }

    // If a session already exists, go to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/dashboard', { replace: true });
      }
    });

    // Subscribe to auth changes and redirect when ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigate('/dashboard', { replace: true });
      }
    });

    // Safety timeout: if nothing happens, send back to login
    const t = setTimeout(() => {
      toast.info('Sign-in redirected. If not signed in, please try again.');
      navigate('/login', { replace: true });
    }, 4000);

    return () => {
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Completing sign-in…</p>
          <p className="text-sm text-muted-foreground">Please wait while we finish authentication.</p>
        </div>
      </main>
    </div>
  );
};

export default AuthCallback;
