import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { InfoCard } from '@/components/ui/info-card';
import { User, Briefcase, GraduationCap, FolderOpen, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">Welcome back, {user?.email}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/jobs">
              <InfoCard
                icon={Target}
                title="Job Tracker"
                description="Manage and track your job applications"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/profile">
              <InfoCard
                icon={User}
                title="Profile"
                description="Manage your personal information and settings"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/profile?section=employment">
              <InfoCard
                icon={Briefcase}
                title="Employment"
                description="Track your work experience and career history"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/profile?section=education">
              <InfoCard
                icon={GraduationCap}
                title="Education"
                description="Document your academic achievements"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/profile?section=projects">
              <InfoCard
                icon={FolderOpen}
                title="Projects"
                description="Showcase your special projects and work"
                className="hover-scale cursor-pointer"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
