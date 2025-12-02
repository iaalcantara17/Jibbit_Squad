import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { InfoCard } from '@/components/ui/info-card';
import { 
  Target, FileText, Mail, BarChart, Settings, Inbox, Calendar, 
  Users, Users2, Brain, Code2, Heart, GraduationCap, UserCircle, 
  TrendingUp, Briefcase, Network, User 
} from 'lucide-react';
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
                title="Jobs"
                description="Manage and track your job applications"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/resumes">
              <InfoCard
                icon={FileText}
                title="Resumes"
                description="Create and manage your resumes"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/cover-letters">
              <InfoCard
                icon={Mail}
                title="Cover Letters"
                description="Build tailored cover letters"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/analytics">
              <InfoCard
                icon={BarChart}
                title="Analytics"
                description="Track your job search progress"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/interview-analytics">
              <InfoCard
                icon={Calendar}
                title="Interview Analytics"
                description="Analyze your interview performance"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/automation">
              <InfoCard
                icon={Settings}
                title="Automation"
                description="Automate your job search workflow"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/email">
              <InfoCard
                icon={Inbox}
                title="Email"
                description="Monitor application responses"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/interview-prep">
              <InfoCard
                icon={Calendar}
                title="Interview Prep"
                description="Prepare for your interviews"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/question-bank">
              <InfoCard
                icon={Brain}
                title="Question Bank"
                description="Practice common interview questions"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/technical-prep">
              <InfoCard
                icon={Code2}
                title="Technical Prep"
                description="Prepare for technical interviews"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/network">
              <InfoCard
                icon={Network}
                title="Network"
                description="Manage your professional contacts"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/collaboration">
              <InfoCard
                icon={Users2}
                title="Collaboration"
                description="Share and collaborate with teams"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/family-dashboard">
              <InfoCard
                icon={Heart}
                title="Progress"
                description="Share your progress with supporters"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/peer-community">
              <InfoCard
                icon={Users}
                title="Community"
                description="Connect with peer job seekers"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/advisors">
              <InfoCard
                icon={UserCircle}
                title="Advisors"
                description="Find career advisors and coaches"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/institutional-admin">
              <InfoCard
                icon={GraduationCap}
                title="Institution"
                description="Institutional admin features"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/teams">
              <InfoCard
                icon={Briefcase}
                title="Teams"
                description="Manage your team collaboration"
                className="hover-scale cursor-pointer"
              />
            </Link>
            <Link to="/profile">
              <InfoCard
                icon={User}
                title="Profile"
                description="Manage your personal information"
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
