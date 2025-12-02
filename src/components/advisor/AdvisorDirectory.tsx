import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, DollarSign, X } from 'lucide-react';
import { AdvisorScheduling } from './AdvisorScheduling';
import { useState } from 'react';

export const AdvisorDirectory = () => {
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  
  const { data: advisors } = useQuery({
    queryKey: ['advisor-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selectedAdvisor = advisors?.find(a => a.id === selectedAdvisorId);

  if (selectedAdvisorId && selectedAdvisor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Book Session with {selectedAdvisor.display_name}</h2>
          <Button variant="ghost" onClick={() => setSelectedAdvisorId(null)}>
            <X className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
        <AdvisorScheduling 
          advisorId={selectedAdvisorId}
          hourlyRate={selectedAdvisor.hourly_rate || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Find Your Career Advisor</h2>
        <p className="text-muted-foreground">
          Expert coaches ready to help you succeed
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {advisors?.map((advisor) => (
          <Card key={advisor.id}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="break-words">{advisor.display_name}</CardTitle>
                  <CardDescription className="mt-1 break-words">{advisor.bio}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {advisor.specialization && advisor.specialization.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {advisor.specialization.map((spec: string, i: number) => (
                    <Badge key={i} variant="secondary">{spec}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                {advisor.hourly_rate && (
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    <span>{advisor.hourly_rate}/hour</span>
                  </div>
                )}
                <Button size="sm" onClick={() => setSelectedAdvisorId(advisor.id)}>
                  Book Session
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {advisors?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No advisors available yet</h3>
            <p className="text-muted-foreground">
              Check back soon for expert career guidance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};