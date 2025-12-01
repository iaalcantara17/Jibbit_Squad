import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Briefcase, TrendingUp } from 'lucide-react';

interface EventROIProps {
  events: any[];
}

export const EventROI = ({ events }: EventROIProps) => {
  const [roiData, setRoiData] = useState({
    totalAttended: 0,
    totalConnections: 0,
    opportunitiesGenerated: 0,
    interviewsSourced: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchROIData();
  }, [events]);

  const fetchROIData = async () => {
    try {
      const attendedEvents = events.filter(e => e.attended);
      const attendedEventIds = attendedEvents.map(e => e.id);

      if (attendedEventIds.length === 0) {
        setRoiData({
          totalAttended: 0,
          totalConnections: 0,
          opportunitiesGenerated: 0,
          interviewsSourced: 0,
        });
        setIsLoading(false);
        return;
      }

      // Fetch connections
      const { data: connections, error: connectionsError } = await supabase
        .from('event_connections')
        .select('id')
        .in('event_id', attendedEventIds);

      if (connectionsError) throw connectionsError;

      // Fetch outcomes
      const { data: outcomes, error: outcomesError } = await supabase
        .from('event_outcomes')
        .select('*')
        .in('event_id', attendedEventIds);

      if (outcomesError) throw outcomesError;

      const opportunitiesGenerated = outcomes?.filter(o => 
        ['referral_requested', 'application_influenced'].includes(o.outcome_type)
      ).length || 0;

      const interviewsSourced = outcomes?.filter(o => 
        o.outcome_type === 'interview_sourced'
      ).length || 0;

      setRoiData({
        totalAttended: attendedEvents.length,
        totalConnections: connections?.length || 0,
        opportunitiesGenerated,
        interviewsSourced,
      });
    } catch (error: any) {
      console.error('Failed to load ROI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      label: 'Events Attended',
      value: roiData.totalAttended,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Connections Made',
      value: roiData.totalConnections,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Opportunities',
      value: roiData.opportunitiesGenerated,
      icon: Briefcase,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Interviews Sourced',
      value: roiData.interviewsSourced,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Networking ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg border animate-pulse bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No events yet</p>
            <p className="text-xs mt-1">Add events to track your networking ROI</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
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
      </CardContent>
    </Card>
  );
};
