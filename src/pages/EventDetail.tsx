import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, MapPin, Edit, Users, Plus, Trash2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventForm } from '@/components/network/EventForm';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [isAddOutcomeOpen, setIsAddOutcomeOpen] = useState(false);
  const [newConnection, setNewConnection] = useState({ contact_id: '', notes: '' });
  const [newOutcome, setNewOutcome] = useState({ outcome_type: 'referral_requested', job_id: '', description: '' });

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchConnections();
      fetchOutcomes();
      fetchContacts();
      fetchJobs();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('networking_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      toast.error('Failed to load event', {
        description: error.message,
      });
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('event_connections')
        .select(`
          *,
          contact:contact_id (
            id,
            name,
            company,
            role
          )
        `)
        .eq('event_id', id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      console.error('Failed to load connections:', error);
    }
  };

  const fetchOutcomes = async () => {
    try {
      const { data, error } = await supabase
        .from('event_outcomes')
        .select(`
          *,
          job:job_id (
            id,
            job_title,
            company_name
          )
        `)
        .eq('event_id', id);

      if (error) throw error;
      setOutcomes(data || []);
    } catch (error: any) {
      console.error('Failed to load outcomes:', error);
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
      console.error('Failed to load contacts:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_title, company_name')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleToggleChecklist = async (index: number) => {
    if (!event) return;

    const updated = [...event.prep_checklist];
    updated[index].completed = !updated[index].completed;

    try {
      const { error } = await supabase
        .from('networking_events')
        .update({ prep_checklist: updated })
        .eq('id', event.id);

      if (error) throw error;
      setEvent({ ...event, prep_checklist: updated });
    } catch (error: any) {
      toast.error('Failed to update checklist', {
        description: error.message,
      });
    }
  };

  const handleAddConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!newConnection.contact_id) {
        toast.error('Please select a contact');
        return;
      }

      const { error } = await supabase.from('event_connections').insert({
        event_id: id,
        contact_id: newConnection.contact_id,
        notes: newConnection.notes || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success('Connection added');
      setIsAddConnectionOpen(false);
      setNewConnection({ contact_id: '', notes: '' });
      fetchConnections();
    } catch (error: any) {
      toast.error('Failed to add connection', {
        description: error.message,
      });
    }
  };

  const handleAddOutcome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('event_outcomes').insert({
        event_id: id,
        outcome_type: newOutcome.outcome_type,
        job_id: newOutcome.job_id || null,
        description: newOutcome.description || null,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success('Outcome recorded');
      setIsAddOutcomeOpen(false);
      setNewOutcome({ outcome_type: 'referral_requested', job_id: '', description: '' });
      fetchOutcomes();
    } catch (error: any) {
      toast.error('Failed to record outcome', {
        description: error.message,
      });
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('event_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      toast.success('Connection removed');
      fetchConnections();
    } catch (error: any) {
      toast.error('Failed to remove connection', {
        description: error.message,
      });
    }
  };

  const handleDeleteOutcome = async (outcomeId: string) => {
    try {
      const { error } = await supabase
        .from('event_outcomes')
        .delete()
        .eq('id', outcomeId);

      if (error) throw error;
      toast.success('Outcome deleted');
      fetchOutcomes();
    } catch (error: any) {
      toast.error('Failed to delete outcome', {
        description: error.message,
      });
    }
  };

  const handleEditSuccess = () => {
    setIsEditFormOpen(false);
    fetchEventDetails();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const outcomeTypeLabels = {
    referral_requested: 'Referral Requested',
    application_influenced: 'Application Influenced',
    interview_sourced: 'Interview Sourced',
    other: 'Other',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/events')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <Button onClick={() => setIsEditFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.event_date), 'PPP')}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {event.event_type}
                  </Badge>
                  {event.attended && <Badge>Attended</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.goals && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goals
                  </h3>
                  <p className="text-sm text-muted-foreground">{event.goals}</p>
                </div>
              )}

              {event.prep_checklist && event.prep_checklist.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Prep Checklist</h3>
                  <div className="space-y-2">
                    {event.prep_checklist.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleToggleChecklist(index)}
                        />
                        <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Connections Made
                  </CardTitle>
                  <Button size="sm" onClick={() => setIsAddConnectionOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {connections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No connections recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.map((conn) => (
                      <div key={conn.id} className="flex items-start justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{conn.contact.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {conn.contact.company} {conn.contact.role && `• ${conn.contact.role}`}
                          </p>
                          {conn.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{conn.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Remove this connection?')) {
                              handleDeleteConnection(conn.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Outcomes</CardTitle>
                  <Button size="sm" onClick={() => setIsAddOutcomeOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {outcomes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No outcomes recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outcomes.map((outcome) => (
                      <div key={outcome.id} className="flex items-start justify-between p-3 rounded-lg border">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {outcomeTypeLabels[outcome.outcome_type as keyof typeof outcomeTypeLabels]}
                          </Badge>
                          {outcome.job && (
                            <p className="text-sm font-medium">
                              {outcome.job.job_title} at {outcome.job.company_name}
                            </p>
                          )}
                          {outcome.description && (
                            <p className="text-xs text-muted-foreground mt-1">{outcome.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this outcome?')) {
                              handleDeleteOutcome(outcome.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <EventForm
            event={event}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddConnectionOpen} onOpenChange={setIsAddConnectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={newConnection.contact_id}
                onValueChange={(value) => setNewConnection({ ...newConnection, contact_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
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
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                placeholder="How did you meet? What did you discuss?"
                value={newConnection.notes}
                onChange={(e) => setNewConnection({ ...newConnection, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsAddConnectionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddConnection}>Add Connection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOutcomeOpen} onOpenChange={setIsAddOutcomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Outcome Type *</Label>
              <Select
                value={newOutcome.outcome_type}
                onValueChange={(value) => setNewOutcome({ ...newOutcome, outcome_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral_requested">Referral Requested</SelectItem>
                  <SelectItem value="application_influenced">Application Influenced</SelectItem>
                  <SelectItem value="interview_sourced">Interview Sourced</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related Job (Optional)</Label>
              <Select
                value={newOutcome.job_id}
                onValueChange={(value) => setNewOutcome({ ...newOutcome, job_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_title} at {job.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Describe the outcome..."
                value={newOutcome.description}
                onChange={(e) => setNewOutcome({ ...newOutcome, description: e.target.value })}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsAddOutcomeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOutcome}>Record Outcome</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetail;
