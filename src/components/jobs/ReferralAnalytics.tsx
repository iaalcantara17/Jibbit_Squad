import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export const ReferralAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    acceptedCount: 0,
    successRate: 0,
    avgResponseTime: 0,
    pendingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_requests')
        .select('*');

      if (error) throw error;

      const totalRequests = data?.length || 0;
      const acceptedCount = data?.filter(r => r.status === 'accepted').length || 0;
      const pendingCount = data?.filter(r => ['draft', 'sent', 'followup'].includes(r.status)).length || 0;
      const successRate = totalRequests > 0 ? (acceptedCount / totalRequests) * 100 : 0;

      // Calculate average response time (from sent to accepted/declined)
      const respondedRequests = data?.filter(r => 
        ['accepted', 'declined'].includes(r.status) && r.last_action_at
      ) || [];

      let avgResponseTime = 0;
      if (respondedRequests.length > 0) {
        const totalResponseTime = respondedRequests.reduce((sum, request) => {
          const sentDate = new Date(request.created_at);
          const responseDate = new Date(request.last_action_at);
          const diffDays = Math.floor((responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0);
        avgResponseTime = Math.round(totalResponseTime / respondedRequests.length);
      }

      setAnalytics({
        totalRequests,
        acceptedCount,
        successRate: Math.round(successRate),
        avgResponseTime,
        pendingCount,
      });
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Requests',
      value: analytics.totalRequests,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Success Rate',
      value: `${analytics.successRate}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Avg Response Time',
      value: analytics.avgResponseTime > 0 ? `${analytics.avgResponseTime}d` : '-',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Accepted',
      value: analytics.acceptedCount,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg border animate-pulse bg-muted" />
            ))}
          </div>
        ) : analytics.totalRequests === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No referral requests yet</p>
            <p className="text-xs mt-1">Start requesting referrals to see analytics</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`rounded-lg ${stat.bgColor} p-2`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {analytics.pendingCount > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm">
              <span className="font-medium">{analytics.pendingCount}</span> referral{analytics.pendingCount !== 1 ? 's' : ''} pending response
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
