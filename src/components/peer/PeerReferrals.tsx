import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Building2, Briefcase, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export const PeerReferrals = () => {
  const { data: referrals } = useQuery({
    queryKey: ['peer-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peer_referrals')
        .select('*, support_groups(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeReferrals = referrals?.filter((r) => 
    !r.expires_at || new Date(r.expires_at) > new Date()
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Peer Referrals</h2>
        <p className="text-muted-foreground">Job opportunities and networking contacts shared by the community</p>
      </div>

      <div className="space-y-4">
        {activeReferrals.map((referral) => (
          <Card key={referral.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    {referral.role_title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {referral.company_name}
                    </div>
                  </CardDescription>
                </div>
                <Badge variant="secondary">{referral.referral_type.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {referral.description && (
                <p className="text-sm text-muted-foreground">{referral.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Shared {format(new Date(referral.created_at), 'MMM d, yyyy')}
                  {referral.expires_at && ` • Expires ${format(new Date(referral.expires_at), 'MMM d')}`}
                </div>
                {referral.application_url && (
                  <Button size="sm" asChild>
                    <a href={referral.application_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeReferrals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No active referrals</h3>
            <p className="text-muted-foreground">
              Check back soon for opportunities shared by your peers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
