import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { ArrowRight, Briefcase, FileText, TrendingUp } from 'lucide-react';
import { InfoCard } from '@/components/ui/info-card';
import { useEffect } from 'react';
import { toast } from 'sonner';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth redirect: clean tokens/errors and navigate when signed in
  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const searchParams = url.searchParams;

    const hasAccessToken = hashParams.has('access_token') || hashParams.has('refresh_token');
    const error = searchParams.get('error') || hashParams.get('error');
    const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

    if (error) {
      toast.error(decodeURIComponent(errorDescription || 'Authentication failed'));
    }

    if (hasAccessToken || error) {
      // Clean sensitive params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <section className="flex-1 container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
            Empower Your Job Search with{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">JibbitATS</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            The modern ATS platform designed for candidates. Build, manage, and showcase your professional profile with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {user ? (
              <Link to="/dashboard"><Button size="lg" className="group">Go to Dashboard<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
            ) : (
              <>
                <Link to="/register"><Button size="lg" className="group">Get Started Free<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
                <Link to="/login"><Button size="lg" variant="outline">Sign In</Button></Link>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="bg-muted/50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything You Need to Stand Out</h2>
            <p className="text-lg text-muted-foreground">Powerful features to showcase your professional journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <InfoCard icon={Briefcase} title="Career Timeline" description="Document your employment history, skills, and achievements in a structured, professional format." />
            <InfoCard icon={FileText} title="Profile Management" description="Create comprehensive profiles with education, certifications, and special projects all in one place." />
            <InfoCard icon={TrendingUp} title="Track Your Progress" description="Monitor your profile completeness and get suggestions to improve your professional presentation." />
          </div>
        </div>
      </section>
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
};

export default Index;
