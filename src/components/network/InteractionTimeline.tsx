import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Mail, MessageSquare, Phone, Plus, Video, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InteractionTimelineProps {
  contactId: string;
  onUpdate?: () => void;
}

const interactionTypeIcons = {
  email: Mail,
  call: Phone,
  coffee: Coffee,
  linkedin: MessageSquare,
  meeting: Video,
  other: MessageSquare,
};

export const InteractionTimeline = ({ contactId, onUpdate }: InteractionTimelineProps) => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    interaction_type: 'email',
    interaction_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    outcome: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInteractions();
  }, [contactId]);

  const fetchInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('interaction_date', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error: any) {
      console.error('Failed to load interactions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('contact_interactions').insert({
        contact_id: contactId,
        user_id: user.id,
        interaction_type: formData.interaction_type,
        interaction_date: formData.interaction_date,
        notes: formData.notes || null,
        outcome: formData.outcome || null,
      });

      if (error) throw error;

      // Update last_contacted_at on contact
      await supabase
        .from('contacts')
        .update({ last_contacted_at: formData.interaction_date })
        .eq('id', contactId);

      toast.success('Interaction logged successfully');
      setIsFormOpen(false);
      setFormData({
        interaction_type: 'email',
        interaction_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: '',
        outcome: '',
      });
      fetchInteractions();
      onUpdate?.();
    } catch (error: any) {
      toast.error('Failed to log interaction', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interaction Timeline</CardTitle>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Interaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No interactions logged yet</p>
              <p className="text-xs mt-1">Start tracking your conversations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => {
                const Icon = interactionTypeIcons[interaction.interaction_type as keyof typeof interactionTypeIcons] || MessageSquare;
                return (
                  <div key={interaction.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="rounded-full bg-primary/10 p-2 h-fit">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{interaction.interaction_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interaction.interaction_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      {interaction.notes && (
                        <p className="text-sm text-muted-foreground">{interaction.notes}</p>
                      )}
                      {interaction.outcome && (
                        <p className="text-sm">
                          <span className="font-medium">Outcome:</span> {interaction.outcome}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interaction_type">Interaction Type *</Label>
                <Select
                  value={formData.interaction_type}
                  onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="coffee">Coffee/Meal</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interaction_date">Date & Time *</Label>
                <Input
                  id="interaction_date"
                  type="datetime-local"
                  value={formData.interaction_date}
                  onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="What did you discuss?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Input
                id="outcome"
                placeholder="e.g., Scheduled follow-up, Got referral, etc."
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Log Interaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
