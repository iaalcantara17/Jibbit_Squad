import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export const JobArchiveView = () => {
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: archivedJobs = [], isLoading } = useQuery({
    queryKey: ['archived-jobs', reasonFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order('updated_at', { ascending: false });

      if (reasonFilter !== 'all') {
        query = query.eq('archive_reason', reasonFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ is_archived: false, archive_reason: null })
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job restored');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-jobs'] });
      toast.success('Job permanently deleted');
    },
  });

  const reasons = ['all', 'position_filled', 'no_response', 'withdrew', 'offer_declined', 'company_closed', 'other'];

  if (isLoading) return <div>Loading archived jobs...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Archive className="h-6 w-6" />
          Archived Jobs ({archivedJobs.length})
        </h2>
        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((r) => (
              <SelectItem key={r} value={r}>
                {r === 'all' ? 'All Reasons' : r.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {archivedJobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No archived jobs found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {archivedJobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{job.job_title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{job.company_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unarchiveMutation.mutate(job.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Permanently delete this job?')) {
                          deleteMutation.mutate(job.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {job.archive_reason && (
                    <Badge variant="secondary">{job.archive_reason.replace('_', ' ')}</Badge>
                  )}
                  <span>Archived {formatDistanceToNow(new Date(job.updated_at))} ago</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
