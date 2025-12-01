import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, User } from 'lucide-react';
import { format } from 'date-fns';

export const GroupWebinars = () => {
  const { data: webinars } = useQuery({
    queryKey: ['group-webinars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_webinars')
        .select('*, support_groups(name)')
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const upcomingWebinars = webinars?.filter((w) => new Date(w.scheduled_date) > now) || [];
  const pastWebinars = webinars?.filter((w) => new Date(w.scheduled_date) <= now) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Group Webinars</h2>
        <p className="text-muted-foreground">Coaching sessions and learning opportunities</p>
      </div>

      {upcomingWebinars.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingWebinars.map((webinar) => (
              <Card key={webinar.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        {webinar.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{webinar.description}</CardDescription>
                    </div>
                    <Badge variant="default">Upcoming</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Hosted by {webinar.host_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(webinar.scheduled_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(webinar.scheduled_date), 'h:mm a')} ({webinar.duration_minutes} minutes)
                    </span>
                  </div>
                  {webinar.meeting_link && (
                    <Button className="w-full" size="sm" asChild>
                      <a href={webinar.meeting_link} target="_blank" rel="noopener noreferrer">
                        Join Session
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastWebinars.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Past Sessions</h3>
          <div className="space-y-3">
            {pastWebinars.map((webinar) => (
              <Card key={webinar.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{webinar.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(webinar.scheduled_date), 'MMMM d, yyyy')} • {webinar.host_name}
                      </p>
                    </div>
                    {webinar.recording_link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={webinar.recording_link} target="_blank" rel="noopener noreferrer">
                          Watch Recording
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {webinars?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No webinars scheduled</h3>
            <p className="text-muted-foreground">
              Check back soon for upcoming coaching sessions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
