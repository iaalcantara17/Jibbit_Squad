import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface MockInterviewSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Job {
  id: string;
  job_title: string;
  company_name: string;
}

export function MockInterviewSetup({ open, onOpenChange }: MockInterviewSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  const [targetRole, setTargetRole] = useState('');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [format, setFormat] = useState<'behavioral' | 'technical' | 'case'>('behavioral');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);

  useEffect(() => {
    const loadJobs = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('jobs')
        .select('id, job_title, company_name')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setJobs(data);
      }
    };

    if (open) {
      loadJobs();
    }
  }, [user, open]);

  const handleStart = async () => {
    if (!user || !targetRole.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a target role',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Verify authentication before creating session
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.user) {
        throw new Error('Authentication required. Please log in again.');
      }

      const selectedJobData = selectedJob ? jobs.find(j => j.id === selectedJob) : null;

      const { data: session, error } = await supabase
        .from('mock_interview_sessions')
        .insert({
          user_id: authSession.user.id,
          job_id: selectedJob || null,
          target_role: targetRole,
          company_name: selectedJobData?.company_name || null,
          format,
          question_count: questionCount,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast({
        title: 'Mock interview started',
        description: 'Get ready to answer your questions!',
      });

      onOpenChange(false);
      
      // Small delay to ensure insert is committed before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate(`/mock-interview/${session.id}`);
    } catch (error) {
      console.error('Error starting mock interview:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start mock interview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Mock Interview</DialogTitle>
          <DialogDescription>
            Configure your mock interview session. You'll answer questions in written format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Target Role *</Label>
            <Input
              id="role"
              placeholder="e.g., Senior Software Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job">Company (Optional)</Label>
            <Select value={selectedJob} onValueChange={(val) => setSelectedJob(val === 'none' ? '' : val)}>
              <SelectTrigger id="job">
                <SelectValue placeholder="Select a job application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_title} - {job.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Interview Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="case">Case Study</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="length">Number of Questions</Label>
            <Select 
              value={questionCount.toString()} 
              onValueChange={(value) => setQuestionCount(parseInt(value) as 5 | 10 | 15)}
            >
              <SelectTrigger id="length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 questions (~15 min)</SelectItem>
                <SelectItem value="10">10 questions (~30 min)</SelectItem>
                <SelectItem value="15">15 questions (~45 min)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Interview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}