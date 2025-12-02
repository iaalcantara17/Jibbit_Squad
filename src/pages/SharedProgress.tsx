import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, Award, Heart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import logo from '@/assets/logo.png';
import { useEffect } from 'react';

const SharedProgress = () => {
  const { token } = useParams<{ token: string }>();

  // Log access
  const logAccessMutation = useMutation({
    mutationFn: async () => {
      if (!token) return;
      
      const { data: share } = await supabase
        .from('progress_shares')
        .select('id')
        .eq('share_token', token)
        .maybeSingle();

      if (share) {
        await supabase.from('progress_share_access_log').insert({
          share_id: share.id,
        });

        await supabase
          .from('progress_shares')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('id', share.id);
      }
    },
  });

  // Trigger logging on mount
  useEffect(() => {
    logAccessMutation.mutate();
  }, [token]);

  const { data: shareData, isLoading, error } = useQuery({
    queryKey: ['shared-progress', token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const { data: share, error: shareError } = await supabase
        .from('progress_shares')
        .select('*')
        .eq('share_token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (shareError) {
        console.error('Share lookup error:', shareError);
        throw new Error('Failed to load share link');
      }

      if (!share) {
        throw new Error('Invalid or inactive share link');
      }

      // Check expiry
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        throw new Error('This share link has expired');
      }

      const userId = share.user_id;

      // Fetch data based on scope
      const [profileRes, goalsRes, jobsRes] = await Promise.all([
        supabase.from('profiles').select('name').eq('user_id', userId).maybeSingle(),
        supabase.from('goals').select('*').eq('user_id', userId),
        share.scope === 'full_progress'
          ? supabase.from('jobs').select('*').eq('user_id', userId)
          : Promise.resolve({ data: [] }),
      ]);

      return {
        share,
        profile: profileRes.data,
        goals: goalsRes.data || [],
        jobs: jobsRes.data || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'This progress share link is invalid or has expired.'}
          </p>
        </Card>
      </div>
    );
  }

  const { share, profile, goals, jobs } = shareData;
  const scope = share.scope;

  // Calculate KPIs
  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter((j: any) => j.status !== 'wishlist').length;
  const interviewJobs = jobs.filter((j: any) => 
    ['phone-screen', 'technical', 'onsite', 'final'].includes(j.status)
  ).length;
  const offerJobs = jobs.filter((j: any) => j.status === 'offer').length;

  const completedGoals = goals.filter((g: any) => g.status === 'completed').length;
  const activeGoals = goals.filter((g: any) => g.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container py-6 max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <img src={logo} alt="JibbitATS" className="h-8 w-auto" />
            <Badge variant="outline" className="break-words">{scope.replace('_', ' ')}</Badge>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold break-words">
              {profile?.name || 'User'}'s Progress
            </h1>
            <p className="text-muted-foreground mt-2">
              Shared with you on {format(new Date(share.created_at), 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Encouragement */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Keep Going!</h3>
                <p className="text-sm text-muted-foreground">
                  Every step forward is progress. Stay consistent and celebrate small wins.
                </p>
              </div>
            </div>
          </Card>

          {/* KPI Summary - Available to all scopes */}
          {(scope === 'kpi_summary' || scope === 'full_progress') && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{appliedJobs}</p>
                    <p className="text-sm text-muted-foreground">Applied</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{interviewJobs}</p>
                    <p className="text-sm text-muted-foreground">Interviews</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{offerJobs}</p>
                    <p className="text-sm text-muted-foreground">Offers</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{completedGoals}</p>
                    <p className="text-sm text-muted-foreground">Goals Done</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Goals - Available to goals_only and full_progress */}
          {(scope === 'goals_only' || scope === 'full_progress') && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Goals & Milestones</h2>
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No goals set yet
                  </p>
                ) : (
                  goals.map((goal: any) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium break-words">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground break-words">
                            {goal.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            goal.status === 'completed'
                              ? 'default'
                              : goal.status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="shrink-0"
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
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Full Progress - Only for full_progress scope */}
          {scope === 'full_progress' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Application Pipeline</h2>
              <div className="space-y-3">
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No applications yet
                  </p>
                ) : (
                  jobs.map((job: any) => (
                    <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium break-words">{job.job_title}</h4>
                        <p className="text-sm text-muted-foreground break-words">{job.company_name}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{job.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedProgress;