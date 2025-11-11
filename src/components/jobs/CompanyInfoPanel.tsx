import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MapPin, TrendingUp, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  companyName: string;
}

export const CompanyInfoPanel = ({ companyName }: Props) => {
  const { data: research, isLoading } = useQuery({
    queryKey: ['company-research', companyName],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('company_research')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_name', companyName)
        .single();

      if (error) {
        // Fetch from edge function if not cached
        const { data: newData, error: fnError } = await supabase.functions.invoke('ai-company-research', {
          body: { company_name: companyName },
        });
        if (fnError) throw fnError;
        return newData;
      }

      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!research) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p>No company information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {companyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {research.description && (
          <div>
            <h4 className="font-semibold text-sm mb-2">About</h4>
            <p className="text-sm text-muted-foreground">{research.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {research.industry && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm font-medium">{research.industry}</p>
              </div>
            </div>
          )}

          {research.size && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-medium">{research.size}</p>
              </div>
            </div>
          )}
        </div>

        {research.culture && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Culture</h4>
            <p className="text-sm text-muted-foreground">{research.culture}</p>
          </div>
        )}

        {research.glassdoor_rating && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Glassdoor: {research.glassdoor_rating}/5.0
            </Badge>
          </div>
        )}

        {research.ai_summary && (
          <div className="p-3 bg-primary/5 border-l-2 border-primary rounded">
            <p className="text-sm">{research.ai_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
