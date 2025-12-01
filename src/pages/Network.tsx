import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Network = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold">Network</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage your professional contacts, track referrals, and leverage your network to unlock new opportunities.
          </p>
          <div className="mt-8 rounded-lg border border-border bg-card p-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Professional Contacts</h2>
                <p className="text-sm text-muted-foreground">
                  Build and maintain relationships with your professional network
                </p>
                <Button onClick={() => navigate('/contacts')} className="w-full">
                  Go to Contacts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Networking Events</h2>
                <p className="text-sm text-muted-foreground">
                  Track events and measure your networking ROI
                </p>
                <Button onClick={() => navigate('/events')} className="w-full">
                  Go to Events
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold">LinkedIn Tools</h2>
                <p className="text-sm text-muted-foreground">
                  Templates and optimization checklist
                </p>
                <Button onClick={() => navigate('/linkedin-optimization')} className="w-full">
                  View Resources
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Network Power Features</h2>
                <p className="text-sm text-muted-foreground">
                  Informational interviews, relationship maintenance, campaigns & references
                </p>
                <Button onClick={() => navigate('/network-power')} className="w-full" variant="default">
                  Unlock Advanced Features
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-center mt-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Track</p>
                <p className="text-xs text-muted-foreground">Contact details, roles, companies</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Engage</p>
                <p className="text-xs text-muted-foreground">Log interactions, set reminders</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Connect</p>
                <p className="text-xs text-muted-foreground">Link to job applications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
