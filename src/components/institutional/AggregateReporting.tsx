import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Briefcase, Target } from 'lucide-react';

export const AggregateReporting = () => {
  const { data: stats } = useQuery({
    queryKey: ['institutional-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get institution cohorts
      const { data: settings } = await supabase
        .from('institutional_settings')
        .select('id')
        .eq('created_by', user.id)
        .single();

      if (!settings) return null;

      const { data: cohorts } = await supabase
        .from('institutional_cohorts')
        .select('id')
        .eq('institution_id', settings.id);

      const cohortIds = cohorts?.map((c) => c.id) || [];
      if (cohortIds.length === 0) return { totalMembers: 0, activeMembers: 0, totalApplications: 0, avgInterviews: 0 };

      const { data: members } = await supabase
        .from('cohort_members')
        .select('user_id, status')
        .in('cohort_id', cohortIds);

      const activeMembers = members?.filter((m) => m.status === 'active').length || 0;

      return {
        totalMembers: members?.length || 0,
        activeMembers,
        totalApplications: 0, // Placeholder
        avgInterviews: 0, // Placeholder
      };
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Metrics</CardTitle>
          <CardDescription>
            Aggregate performance across all cohorts
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeMembers || 0}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalApplications || 0}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.avgInterviews || 0}</p>
                <p className="text-sm text-muted-foreground">Avg Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ROI Analysis</CardTitle>
          <CardDescription>
            Program effectiveness and success metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Detailed ROI reporting will be available once cohort data is collected
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
