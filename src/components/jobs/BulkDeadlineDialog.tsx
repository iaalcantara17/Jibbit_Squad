import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Plus } from 'lucide-react';
import { addDays } from 'date-fns';

interface BulkDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedJobIds: string[];
  onSuccess: () => void;
}

const DEADLINE_PRESETS = [
  { label: '+3 Days', days: 3 },
  { label: '+7 Days', days: 7 },
  { label: '+14 Days', days: 14 },
  { label: '+30 Days', days: 30 },
];

export function BulkDeadlineDialog({ 
  open, 
  onOpenChange, 
  selectedJobIds, 
  onSuccess 
}: BulkDeadlineDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(7);

  const handleExtendDeadlines = async () => {
    if (selectedJobIds.length === 0) {
      toast.error('No jobs selected');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch current jobs
      const { data: jobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id, application_deadline')
        .in('id', selectedJobIds);

      if (fetchError) throw fetchError;

      // Update deadlines
      const updates = jobs?.map(job => {
        const currentDeadline = job.application_deadline 
          ? new Date(job.application_deadline) 
          : new Date();
        const newDeadline = addDays(currentDeadline, selectedDays);
        
        return supabase
          .from('jobs')
          .update({ application_deadline: newDeadline.toISOString().split('T')[0] })
          .eq('id', job.id);
      });

      if (updates) {
        await Promise.all(updates);
      }

      toast.success(`Extended ${selectedJobIds.length} job deadline(s) by ${selectedDays} days`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error extending deadlines:', error);
      toast.error('Failed to extend deadlines');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend Application Deadlines</DialogTitle>
          <DialogDescription>
            Extend deadlines for {selectedJobIds.length} selected job(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label>Select Extension Period</Label>
          <div className="grid grid-cols-2 gap-3">
            {DEADLINE_PRESETS.map((preset) => (
              <Button
                key={preset.days}
                variant={selectedDays === preset.days ? 'default' : 'outline'}
                onClick={() => setSelectedDays(preset.days)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtendDeadlines}
            disabled={isLoading || selectedJobIds.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isLoading ? 'Extending...' : 'Extend Deadlines'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
