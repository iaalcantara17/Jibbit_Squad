import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

interface EventFormProps {
  event?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EventForm = ({ event, onSuccess, onCancel }: EventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    event_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    location: '',
    event_type: 'in-person',
    goals: '',
    notes: '',
    attended: false,
  });
  const [checklistItems, setChecklistItems] = useState<Array<{ label: string; completed: boolean }>>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        event_date: event.event_date 
          ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        location: event.location || '',
        event_type: event.event_type || 'in-person',
        goals: event.goals || '',
        notes: event.notes || '',
        attended: event.attended || false,
      });
      setChecklistItems(event.prep_checklist || []);
    }
  }, [event]);

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, { label: newChecklistItem, completed: false }]);
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (index: number) => {
    const updated = [...checklistItems];
    updated[index].completed = !updated[index].completed;
    setChecklistItems(updated);
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const eventData = {
        title: formData.title,
        event_date: formData.event_date,
        location: formData.location || null,
        event_type: formData.event_type,
        goals: formData.goals || null,
        notes: formData.notes || null,
        attended: formData.attended,
        prep_checklist: checklistItems,
        user_id: user.id,
      };

      if (event) {
        const { error } = await supabase
          .from('networking_events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        toast.success('Event updated successfully');
      } else {
        const { error } = await supabase
          .from('networking_events')
          .insert(eventData);

        if (error) throw error;
        toast.success('Event created successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(event ? 'Failed to update event' : 'Failed to create event', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{event ? 'Edit Event' : 'Add Networking Event'}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Tech Networking Mixer"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="event_date">Date & Time *</Label>
            <Input
              id="event_date"
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Type *</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In-person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Address or video call link"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Goals</Label>
          <Textarea
            id="goals"
            rows={2}
            placeholder="What do you want to achieve at this event?"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Prep Checklist</Label>
          <div className="space-y-2">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleChecklistItem(index)}
                />
                <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChecklistItem(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add checklist item..."
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddChecklistItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Any additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="attended"
            checked={formData.attended}
            onCheckedChange={(checked) => setFormData({ ...formData, attended: !!checked })}
          />
          <Label htmlFor="attended" className="cursor-pointer">
            Mark as attended
          </Label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};
