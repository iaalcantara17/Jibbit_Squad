import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, LogOut, Target, FileText, Mail, BarChart, Settings, Inbox, Calendar, Users, Users2, Brain, Code2, Heart, GraduationCap, UserCircle, TrendingUp, Briefcase, Network, DollarSign, LineChart, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const navItems = [
    { to: "/dashboard", icon: TrendingUp, label: "Dashboard" },
    { to: "/jobs", icon: Target, label: "Jobs" },
    { to: "/resumes", icon: FileText, label: "Resumes" },
    { to: "/cover-letters", icon: Mail, label: "Cover Letters" },
    { to: "/analytics", icon: BarChart, label: "Analytics" },
    { to: "/interview-analytics", icon: Calendar, label: "Interview Analytics" },
    { to: "/automation", icon: Settings, label: "Automation" },
    { to: "/email", icon: Inbox, label: "Email" },
    { to: "/interview-prep", icon: Calendar, label: "Interview Prep" },
    { to: "/question-bank", icon: Brain, label: "Question Bank" },
    { to: "/technical-prep", icon: Code2, label: "Technical Prep" },
    { to: "/network", icon: Users, label: "Network" },
    { to: "/collaboration", icon: Users2, label: "Collaboration" },
    { to: "/family-dashboard", icon: Heart, label: "Progress" },
    { to: "/peer-community", icon: Users, label: "Community" },
    { to: "/advisors", icon: UserCircle, label: "Advisors" },
    { to: "/institutional-admin", icon: GraduationCap, label: "Institution" },
    { to: "/teams", icon: Briefcase, label: "Teams" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="JibbitATS logo" className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.to)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              <NotificationCenter />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
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
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="container py-4 space-y-1">
              {user ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.to)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-border mt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
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
          </ScrollArea>
        </div>
      )}
    </nav>
  );
};
