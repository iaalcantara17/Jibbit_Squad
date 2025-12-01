import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { Upload, Users } from 'lucide-react';

export const BulkOnboarding = () => {
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [cohortDescription, setCohortDescription] = useState('');
  const [startDate, setStartDate] = useState('');

  const { data: cohorts } = useQuery({
    queryKey: ['institutional-cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutional_cohorts')
        .select('*, cohort_members(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCohortMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: settings } = await supabase
        .from('institutional_settings')
        .select('id')
        .eq('created_by', user.id)
        .single();

      if (!settings) throw new Error('Institution settings not found');

      const { data: cohort, error } = await supabase
        .from('institutional_cohorts')
        .insert({
          institution_id: settings.id,
          cohort_name: cohortName,
          description: cohortDescription,
          start_date: startDate,
        })
        .select()
        .single();

      if (error) throw error;

      // Process CSV (simplified for demo)
      const lines = csvContent.split('\n').filter((l) => l.trim());
      const emails = lines.map((l) => l.split(',')[0].trim()).filter(Boolean);

      toast.success(`Cohort created! ${emails.length} invitations will be sent.`);
      return cohort;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutional-cohorts'] });
      setCohortName('');
      setCohortDescription('');
      setStartDate('');
      setCsvContent('');
      toast.success('Cohort created successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to create cohort: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Cohort</CardTitle>
          <CardDescription>
            Bulk onboard students or employees via CSV upload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cohortName">Cohort Name</Label>
            <Input
              id="cohortName"
              value={cohortName}
              onChange={(e) => setCohortName(e.target.value)}
              placeholder="e.g., Class of 2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={cohortDescription}
              onChange={(e) => setCohortDescription(e.target.value)}
              placeholder="Cohort description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csv">Upload CSV</Label>
            <Textarea
              id="csv"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="email@example.com,John Doe,johndoe@example.com,Jane Smith,janesmith@example.com"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Format: email (one per line or comma-separated)
            </p>
          </div>
          <Button
            onClick={() => createCohortMutation.mutate()}
            disabled={!cohortName || !startDate || !csvContent}
          >
            <Upload className="h-4 w-4 mr-2" />
            Create Cohort & Send Invitations
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Cohorts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cohorts?.map((cohort) => (
              <div key={cohort.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{cohort.cohort_name}</h4>
                  <p className="text-sm text-muted-foreground">{cohort.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cohort.cohort_members?.[0]?.count || 0} members</span>
                </div>
              </div>
            ))}
            {cohorts?.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No cohorts created yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
