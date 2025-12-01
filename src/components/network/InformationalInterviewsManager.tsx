import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Plus, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';

interface InformationalInterview {
  id: string;
  contact_id: string;
  contact?: { name: string; company?: string; role?: string };
  outreach_sent_at?: string;
  scheduled_date?: string;
  prep_checklist: {
    topics: string[];
    questions_prepared: boolean;
    research_completed: boolean;
    goals_defined: boolean;
  };
  outcome_notes?: string;
  follow_up_tasks: Array<{ task: string; completed: boolean }>;
  status: string;
  created_at: string;
}

export const InformationalInterviewsManager = () => {
  const [interviews, setInterviews] = useState<InformationalInterview[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InformationalInterview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    contact_id: '',
    outreach_sent_at: '',
    scheduled_date: '',
    topics: '',
    questions_prepared: false,
    research_completed: false,
    goals_defined: false,
    outcome_notes: '',
    follow_up_tasks: '',
    status: 'outreach_pending',
  });

  useEffect(() => {
    fetchInterviews();
    fetchContacts();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('informational_interviews')
        .select('*, contact:contacts(name, company, role)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterviews((data as any) || []);
    } catch (error: any) {
      toast.error('Failed to load interviews', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, company, role')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error('Failed to load contacts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const topics = formData.topics.split(',').map(t => t.trim()).filter(Boolean);
      const followUpTasks = formData.follow_up_tasks
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean)
        .map(task => ({ task, completed: false }));

      const interviewData = {
        user_id: user.id,
        contact_id: formData.contact_id,
        outreach_sent_at: formData.outreach_sent_at || null,
        scheduled_date: formData.scheduled_date || null,
        prep_checklist: {
          topics,
          questions_prepared: formData.questions_prepared,
          research_completed: formData.research_completed,
          goals_defined: formData.goals_defined,
        },
        outcome_notes: formData.outcome_notes || null,
        follow_up_tasks: followUpTasks,
        status: formData.status,
      };

      if (editingInterview) {
        const { error } = await supabase
          .from('informational_interviews')
          .update(interviewData)
          .eq('id', editingInterview.id);

        if (error) throw error;
        toast.success('Interview updated');
      } else {
        const { error } = await supabase
          .from('informational_interviews')
          .insert(interviewData);

        if (error) throw error;
        toast.success('Interview tracked');
      }

      setIsFormOpen(false);
      resetForm();
      fetchInterviews();
    } catch (error: any) {
      toast.error('Failed to save interview', { description: error.message });
    }
  };

  const handleEdit = (interview: InformationalInterview) => {
    setEditingInterview(interview);
    setFormData({
      contact_id: interview.contact_id,
      outreach_sent_at: interview.outreach_sent_at ? format(new Date(interview.outreach_sent_at), 'yyyy-MM-dd') : '',
      scheduled_date: interview.scheduled_date ? format(new Date(interview.scheduled_date), 'yyyy-MM-dd') : '',
      topics: interview.prep_checklist.topics.join(', '),
      questions_prepared: interview.prep_checklist.questions_prepared,
      research_completed: interview.prep_checklist.research_completed,
      goals_defined: interview.prep_checklist.goals_defined,
      outcome_notes: interview.outcome_notes || '',
      follow_up_tasks: interview.follow_up_tasks.map(t => t.task).join('\n'),
      status: interview.status,
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      outreach_sent_at: '',
      scheduled_date: '',
      topics: '',
      questions_prepared: false,
      research_completed: false,
      goals_defined: false,
      outcome_notes: '',
      follow_up_tasks: '',
      status: 'outreach_pending',
    });
    setEditingInterview(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      outreach_pending: 'secondary',
      scheduled: 'default',
      completed: 'outline',
      declined: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informational Interviews</CardTitle>
              <CardDescription>Track outreach, prep, and outcomes</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Track Interview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No informational interviews tracked yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <Card key={interview.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleEdit(interview)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{interview.contact?.name}</h4>
                          {getStatusBadge(interview.status)}
                        </div>
                        {interview.contact?.company && (
                          <p className="text-sm text-muted-foreground">
                            {interview.contact.role} at {interview.contact.company}
                          </p>
                        )}
                        {interview.scheduled_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(interview.scheduled_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInterview ? 'Update Interview' : 'Track Informational Interview'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `- ${contact.company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Outreach Sent</Label>
                <Input
                  type="date"
                  value={formData.outreach_sent_at}
                  onChange={(e) => setFormData({ ...formData, outreach_sent_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outreach_pending">Outreach Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-base">Prep Checklist</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="questions_prepared"
                    checked={formData.questions_prepared}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, questions_prepared: checked as boolean })
                    }
                  />
                  <label htmlFor="questions_prepared" className="text-sm">
                    Questions prepared
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="research_completed"
                    checked={formData.research_completed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, research_completed: checked as boolean })
                    }
                  />
                  <label htmlFor="research_completed" className="text-sm">
                    Research completed
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="goals_defined"
                    checked={formData.goals_defined}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, goals_defined: checked as boolean })
                    }
                  />
                  <label htmlFor="goals_defined" className="text-sm">
                    Goals defined
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Topics to Cover (comma-separated)</Label>
                <Input
                  placeholder="Career path, company culture, industry trends"
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Outcome Notes</Label>
              <Textarea
                placeholder="Key insights, advice received, referrals..."
                value={formData.outcome_notes}
                onChange={(e) => setFormData({ ...formData, outcome_notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up Tasks (one per line)</Label>
              <Textarea
                placeholder="Send thank you note&#10;Connect on LinkedIn&#10;Share article discussed"
                value={formData.follow_up_tasks}
                onChange={(e) => setFormData({ ...formData, follow_up_tasks: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingInterview ? 'Update' : 'Track'} Interview
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};