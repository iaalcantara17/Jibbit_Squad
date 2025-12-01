import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

export const GroupChallenges = () => {
  const { data: challenges } = useQuery({
    queryKey: ['group-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_challenges')
        .select('*, support_groups(name), challenge_participants(count)')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Group Challenges</h2>
        <p className="text-muted-foreground">Accountability programs to reach your goals</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {challenges?.map((challenge) => {
          const progress = challenge.target_value > 0
            ? Math.min(100, Math.round((0 / challenge.target_value) * 100))
            : 0;

          return (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {challenge.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{challenge.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{challenge.challenge_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target: {challenge.target_value}</span>
                    <span>{challenge.duration_days} days</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <Button className="w-full" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Join Challenge
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
            <p className="text-muted-foreground">
              Check back soon for accountability programs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
