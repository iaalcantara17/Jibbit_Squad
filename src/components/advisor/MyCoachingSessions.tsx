import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';

export const MyCoachingSessions = () => {
  const { data: sessions } = useQuery({
    queryKey: ['my-coaching-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*, advisor_profiles(display_name), session_payments(payment_status)')
        .eq('client_user_id', user.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const upcomingSessions = sessions?.filter((s) => new Date(s.scheduled_date) > new Date()) || [];
  const pastSessions = sessions?.filter((s) => new Date(s.scheduled_date) <= new Date()) || [];

  return (
    <div className="space-y-6">
      {upcomingSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
          {upcomingSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{session.session_type.replace('_', ' ')}</CardTitle>
                    <CardDescription>
                      with {session.advisor_profiles?.display_name}
                    </CardDescription>
                  </div>
                  <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(session.scheduled_date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(session.scheduled_date), 'h:mm a')} ({session.duration_minutes} minutes)
                  </span>
                </div>
                {session.meeting_link && (
                  <Button className="w-full" size="sm" asChild>
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Join Session
                    </a>
                  </Button>
                )}
                {session.session_payments?.[0]?.payment_status && (
                  <div className="text-sm text-muted-foreground">
                    Payment: {session.session_payments[0].payment_status}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Past Sessions</h2>
          {pastSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{session.session_type.replace('_', ' ')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.scheduled_date), 'MMM d, yyyy')} • {session.advisor_profiles?.display_name}
                    </p>
                  </div>
                  <Badge variant="outline">{session.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {sessions?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No coaching sessions yet</h3>
            <p className="text-muted-foreground mb-4">
              Book a session with an advisor to get started
            </p>
            <Button>Find Advisors</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
