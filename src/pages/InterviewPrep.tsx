import { Navigation } from '@/components/Navigation';
import { Calendar, Eye, Video, Building, Phone, Clock, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getUserInterviewsWithJobs } from '@/lib/api/interviews';
import { Interview } from '@/types/interviews';
import { InterviewReminders } from '@/components/interviews/InterviewReminders';
import { MockInterviewSetup } from '@/components/interviews/MockInterviewSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format, isFuture, isPast } from 'date-fns';

const InterviewPrep = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) return;
      
      try {
        const data = await getUserInterviewsWithJobs(user.id);
        setInterviews(data as Interview[]);
      } catch (error) {
        console.error('Error loading interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [user]);

  const upcomingInterviews = interviews.filter(
    (i) => i.scheduled_start && isFuture(new Date(i.scheduled_start)) && i.status === 'scheduled'
  );
  const pastInterviews = interviews.filter(
    (i) => i.scheduled_start && isPast(new Date(i.scheduled_start)) || i.status === 'completed'
  );

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'remote':
        return <Video className="h-4 w-4" />;
      case 'onsite':
        return <Building className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">Interview Prep</h1>
              <p className="text-muted-foreground mt-1">
                Manage interview schedules and preparation
              </p>
            </div>
          </div>

          {/* Reminder Banners */}
          {!loading && <InterviewReminders interviews={interviews} />}

          {/* Mock Interview */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Practice with Mock Interviews</CardTitle>
              <CardDescription>
                Simulate real interview scenarios and get AI-powered feedback on your responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setSetupOpen(true)} size="lg" className="w-full sm:w-auto">
                <Play className="mr-2 h-5 w-5" />
                Start Mock Interview
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Interviews */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>
                Interviews scheduled in the future
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading interviews...
                </p>
              ) : upcomingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming interviews. Schedule one from your job applications.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getInterviewIcon(interview.interview_type || '')}
                            <Badge variant="outline" className="capitalize">
                              {interview.interview_type}
                            </Badge>
                            <Badge variant="secondary">
                              {interview.status || 'scheduled'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {interview.scheduled_start && format(new Date(interview.scheduled_start), 'PPP p')}
                            </span>
                          </div>
                          {interview.location && (
                            <p className="text-sm text-muted-foreground">
                              Location: {interview.location}
                            </p>
                          )}
                          {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Interviewers: {interview.interviewer_names.join(', ')}
                            </p>
                          )}
                        </div>
                        <Link to={`/interview/${interview.id}`}>
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Interviews */}
          {pastInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Interviews</CardTitle>
                <CardDescription>
                  Completed or past interviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastInterviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getInterviewIcon(interview.interview_type || '')}
                            <Badge variant="outline" className="capitalize">
                              {interview.interview_type}
                            </Badge>
                            <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                              {interview.status || 'scheduled'}
                            </Badge>
                            {interview.outcome && interview.outcome !== 'pending' && (
                              <Badge variant={interview.outcome === 'pass' || interview.outcome === 'offer' ? 'default' : 'destructive'}>
                                {interview.outcome}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {interview.scheduled_start && format(new Date(interview.scheduled_start), 'PPP')}
                            </span>
                          </div>
                        </div>
                        <Link to={`/interview/${interview.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <MockInterviewSetup open={setupOpen} onOpenChange={setSetupOpen} />
    </div>
  );
};

export default InterviewPrep;
