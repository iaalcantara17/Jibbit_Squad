import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Target, TrendingUp, Calendar, Award, Heart, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressShareDialog } from '@/components/progress/ProgressShareDialog';
import { useState } from 'react';

const FamilyDashboard = () => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, status, created_at')
        .eq('is_archived', false);
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats without sensitive info
  const totalApplications = jobs?.filter(j => j.status !== 'wishlist').length || 0;
  const interviewsScheduled = jobs?.filter(j => 
    ['phone-screen', 'technical', 'onsite', 'final'].includes(j.status)
  ).length || 0;
  const offersReceived = jobs?.filter(j => j.status === 'offer').length || 0;
  
  const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;
  const activeGoals = goals?.filter(g => g.status === 'in-progress').length || 0;
  const totalGoals = goals?.length || 0;

  // Calculate streak (simplified)
  const thisWeekApplications = jobs?.filter(j => {
    const jobDate = new Date(j.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return jobDate >= weekAgo && j.status !== 'wishlist';
  }).length || 0;

  const encouragementMessages = [
    "You're making great progress! Keep it up!",
    "Every application is a step closer to your goal.",
    "Stay consistent - your hard work will pay off!",
    "Proud of your dedication and effort!",
    "You've got this! Keep pushing forward!",
  ];

  const randomEncouragement = encouragementMessages[
    Math.floor(Math.random() * encouragementMessages.length)
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold">Progress Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Family-friendly view of your job search journey
            </p>
            <Button onClick={() => setShareDialogOpen(true)} className="mt-4">
              Share Progress
            </Button>
          </div>

          {/* Encouragement Card */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Keep Going!</h3>
                <p className="text-muted-foreground">{randomEncouragement}</p>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  <p className="font-semibold">Applications</p>
                </div>
                <p className="text-3xl font-bold">{totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total submitted</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-500" />
                  <p className="font-semibold">Interviews</p>
                </div>
                <p className="text-3xl font-bold">{interviewsScheduled}</p>
                <p className="text-sm text-muted-foreground">In progress</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-green-500" />
                  <p className="font-semibold">Offers</p>
                </div>
                <p className="text-3xl font-bold">{offersReceived}</p>
                <p className="text-sm text-muted-foreground">Received</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-purple-500" />
                  <p className="font-semibold">This Week</p>
                </div>
                <p className="text-3xl font-bold">{thisWeekApplications}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </Card>
          </div>

          {/* Goals Progress */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Goals & Achievements
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Overall Goal Progress</p>
                  <p className="text-sm text-muted-foreground">
                    {completedGoals} of {totalGoals} goals completed
                  </p>
                </div>
                <Badge variant="default">{totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%</Badge>
              </div>
              <Progress value={totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0} />

              <div className="space-y-3 mt-6">
                {goals?.slice(0, 5).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          goal.status === 'completed'
                            ? 'default'
                            : goal.status === 'in-progress'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    {goal.current_value !== null && goal.target_value !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{goal.current_value} / {goal.target_value}</span>
                          <span>{Math.round((goal.current_value / goal.target_value) * 100)}%</span>
                        </div>
                        <Progress value={(goal.current_value / goal.target_value) * 100} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Activity Highlights */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Highlights
            </h2>
            <div className="space-y-3">
              {activeGoals > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary">Active</Badge>
                  <p className="text-sm">{activeGoals} goals in progress</p>
                </div>
              )}
              {thisWeekApplications > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary">This Week</Badge>
                  <p className="text-sm">{thisWeekApplications} applications submitted</p>
                </div>
              )}
              {interviewsScheduled > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Badge variant="default">Upcoming</Badge>
                  <p className="text-sm">{interviewsScheduled} interviews scheduled</p>
                </div>
              )}
            </div>
          </Card>

          {/* Privacy Notice */}
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              🔒 This dashboard hides sensitive details like company names and salary information.
              Perfect for sharing with family and friends!
            </p>
          </Card>
        </div>
      </div>

      <ProgressShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
    </div>
  );
};

export default FamilyDashboard;
