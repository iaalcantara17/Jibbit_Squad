import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ReferralRequestFormProps {
  job: any;
  contact?: any;
  request?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReferralRequestForm = ({ job, contact, request, onSuccess, onCancel }: ReferralRequestFormProps) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contact_id: contact?.id || '',
    status: 'draft',
    notes: '',
    next_followup_at: '',
    message_sent: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!contact) {
      fetchContacts();
    }
  }, [contact]);

  useEffect(() => {
    if (request) {
      setFormData({
        contact_id: request.contact_id,
        status: request.status,
        notes: request.notes || '',
        next_followup_at: request.next_followup_at 
          ? format(new Date(request.next_followup_at), "yyyy-MM-dd'T'HH:mm")
          : '',
        message_sent: request.message_sent || '',
      });
    }
  }, [request]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!formData.contact_id) {
        throw new Error('Please select a contact');
      }

      const requestData = {
        user_id: user.id,
        job_id: job.id,
        contact_id: formData.contact_id,
        status: formData.status,
        notes: formData.notes || null,
        next_followup_at: formData.next_followup_at || null,
        message_sent: formData.message_sent || null,
        last_action_at: new Date().toISOString(),
      };

      if (request) {
        const { error } = await supabase
          .from('referral_requests')
          .update(requestData)
          .eq('id', request.id);

        if (error) throw error;
        toast.success('Referral request updated');
      } else {
        const { error } = await supabase
          .from('referral_requests')
          .insert(requestData);

        if (error) throw error;
        toast.success('Referral request created');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(request ? 'Failed to update request' : 'Failed to create request', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{request ? 'Update Referral Request' : 'Request Referral'}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {contact ? (
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="font-medium">{contact.name}</p>
            <p className="text-sm text-muted-foreground">
              {contact.company} {contact.role && `• ${contact.role}`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="contact_id">Select Contact *</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.company && `- ${c.company}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="p-3 rounded-lg border bg-muted/50">
          <p className="text-sm font-medium mb-1">{job.job_title}</p>
          <p className="text-sm text-muted-foreground">{job.company_name}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="followup">Follow-up</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="next_followup_at">Next Follow-up</Label>
          <Input
            id="next_followup_at"
            type="datetime-local"
            value={formData.next_followup_at}
            onChange={(e) => setFormData({ ...formData, next_followup_at: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message_sent">Message Sent</Label>
          <Textarea
            id="message_sent"
            rows={4}
            placeholder="Paste the message you sent to your contact..."
            value={formData.message_sent}
            onChange={(e) => setFormData({ ...formData, message_sent: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Any additional notes or context..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : request ? 'Update Request' : 'Create Request'}
        </Button>
      </div>
    </form>
  );
};
