import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AnalyticsFunnelView = () => {
  const { data: funnel, isLoading } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('status, company_name, created_at, status_updated_at')
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (error) throw error;

      const stages = ['interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];
      const counts = stages.reduce((acc, stage) => {
        acc[stage] = jobs.filter((j) => j.status === stage).length;
        return acc;
      }, {} as Record<string, number>);

      // Time to response by company
      const timeByCompany = jobs
        .filter((j) => j.status_updated_at && j.created_at)
        .reduce((acc, j) => {
          const diff = new Date(j.status_updated_at).getTime() - new Date(j.created_at).getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          if (!acc[j.company_name]) acc[j.company_name] = [];
          acc[j.company_name].push(hours);
          return acc;
        }, {} as Record<string, number[]>);

      const avgTimeByCompany = Object.entries(timeByCompany).map(([company, times]) => ({
        company,
        avgHours: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
        count: times.length,
      }));

      return { counts, avgTimeByCompany };
    },
  });

  if (isLoading) return <div>Loading analytics...</div>;

  const stages = [
    { key: 'interested', label: 'Interested', color: 'bg-blue-500' },
    { key: 'applied', label: 'Applied', color: 'bg-indigo-500' },
    { key: 'phone_screen', label: 'Phone Screen', color: 'bg-purple-500' },
    { key: 'interview', label: 'Interview', color: 'bg-pink-500' },
    { key: 'offer', label: 'Offer', color: 'bg-green-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  ];

  const maxCount = Math.max(...Object.values(funnel?.counts || {}));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map((stage) => {
              const count = funnel?.counts[stage.key] || 0;
              const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">{count} jobs</span>
                  </div>
                  <div className="h-8 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all flex items-center justify-end pr-3`}
                      style={{ width: `${width}%` }}
                    >
                      {count > 0 && (
                        <span className="text-xs font-medium text-white">
                          {Math.round((count / (funnel?.counts?.interested || 1)) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Avg. Time to Response by Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnel?.avgTimeByCompany
              .sort((a, b) => a.avgHours - b.avgHours)
              .slice(0, 10)
              .map((item) => (
                <div key={item.company} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.count} apps</Badge>
                    <Badge variant="secondary">
                      {item.avgHours < 24
                        ? `${item.avgHours}h`
                        : `${Math.round(item.avgHours / 24)}d`}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
