import { Navigation } from '@/components/Navigation';
import { Users2, Users, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Collaboration = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold">Collaboration</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Collaborate with mentors, coaches, and team members on your job search journey.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Teams</h2>
              </div>
              <p className="text-muted-foreground">
                Create teams with role-based access for admins, mentors, and candidates. Collaborate securely with proper permissions.
              </p>
              <Button asChild>
                <Link to="/teams">Go to Teams</Link>
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Document Review</h2>
              </div>
              <p className="text-muted-foreground">
                Share resumes and cover letters with team members for collaborative review and feedback.
              </p>
              <Button asChild>
                <Link to="/documents">Go to Documents</Link>
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Progress Sharing</h2>
              </div>
              <p className="text-muted-foreground">
                Share your job search progress with accountability partners and family members with privacy controls.
              </p>
              <Button asChild>
                <Link to="/family-dashboard">Go to Progress</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
