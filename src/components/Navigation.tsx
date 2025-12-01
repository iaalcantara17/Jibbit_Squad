import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LogOut, User, Target, FileText, Mail, BarChart, Settings, Inbox, Calendar, Users, Users2, Brain, Code2, Heart } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="JibbitATS logo" className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/jobs"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/jobs') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Target className="inline h-4 w-4 mr-1" />
                Jobs
              </Link>
              <Link
                to="/resumes"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/resumes') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-1" />
                Resumes
              </Link>
              <Link
                to="/cover-letters"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/cover-letters') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Mail className="inline h-4 w-4 mr-1" />
                Cover Letters
              </Link>
              <Link
                to="/analytics"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/analytics') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <BarChart className="inline h-4 w-4 mr-1" />
                Analytics
              </Link>
              <Link
                to="/interview-analytics"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/interview-analytics') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-1" />
                Interview Analytics
              </Link>
              <Link
                to="/automation"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/automation') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Settings className="inline h-4 w-4 mr-1" />
                Automation
              </Link>
              <Link
                to="/email"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/email') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Inbox className="inline h-4 w-4 mr-1" />
                Email
              </Link>
              <Link
                to="/interview-prep"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/interview-prep') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-1" />
                Interview Prep
              </Link>
              <Link
                to="/question-bank"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/question-bank') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Brain className="inline h-4 w-4 mr-1" />
                Question Bank
              </Link>
              <Link
                to="/technical-prep"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/technical-prep') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Code2 className="inline h-4 w-4 mr-1" />
                Technical Prep
              </Link>
              <Link
                to="/network"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/network') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Users className="inline h-4 w-4 mr-1" />
                Network
              </Link>
              <Link
                to="/collaboration"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/collaboration') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Users2 className="inline h-4 w-4 mr-1" />
                Collaboration
              </Link>
              <Link
                to="/family-dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/family-dashboard') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Heart className="inline h-4 w-4 mr-1" />
                Progress
              </Link>
              <Link
                to="/profile"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <User className="inline h-4 w-4 mr-1" />
                Profile
              </Link>
              <NotificationCenter />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 space-y-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/jobs')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Target className="inline h-4 w-4 mr-1" />
                  Jobs
                </Link>
                <Link
                  to="/resumes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/resumes')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <FileText className="inline h-4 w-4 mr-1" />
                  Resumes
                </Link>
                <Link
                  to="/cover-letters"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/cover-letters')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Mail className="inline h-4 w-4 mr-1" />
                  Cover Letters
                </Link>
                <Link
                  to="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/analytics')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <BarChart className="inline h-4 w-4 mr-1" />
                  Analytics
                </Link>
                <Link
                  to="/interview-analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/interview-analytics')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Interview Analytics
                </Link>
                <Link
                  to="/automation"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/automation')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Settings className="inline h-4 w-4 mr-1" />
                  Automation
                </Link>
                <Link
                  to="/email"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/email')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Inbox className="inline h-4 w-4 mr-1" />
                  Email
                </Link>
                <Link
                  to="/interview-prep"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/interview-prep')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Interview Prep
                </Link>
                <Link
                  to="/question-bank"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/question-bank')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Brain className="inline h-4 w-4 mr-1" />
                  Question Bank
                </Link>
                <Link
                  to="/technical-prep"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/technical-prep')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Code2 className="inline h-4 w-4 mr-1" />
                  Technical Prep
                </Link>
                <Link
                  to="/network"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/network')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Users className="inline h-4 w-4 mr-1" />
                  Network
                </Link>
                <Link
                  to="/collaboration"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/collaboration')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Users2 className="inline h-4 w-4 mr-1" />
                  Collaboration
                </Link>
                <Link
                  to="/family-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/family-dashboard')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Heart className="inline h-4 w-4 mr-1" />
                  Progress
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <User className="inline h-4 w-4 mr-1" />
                  Profile
                </Link>
                <div className="px-4 py-2">
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                >
                  <LogOut className="inline h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="px-4 py-2">
                  <ThemeToggle />
                </div>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
