import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Calendar, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';

interface ContactRemindersProps {
  contactId: string;
}

export const ContactReminders = ({ contactId }: ContactRemindersProps) => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    reminder_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [contactId]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_reminders')
        .select('*')
        .eq('contact_id', contactId)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('contact_reminders').insert({
        contact_id: contactId,
        user_id: user.id,
        reminder_date: formData.reminder_date,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success('Reminder set successfully');
      setIsFormOpen(false);
      setFormData({
        reminder_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
        notes: '',
      });
      fetchReminders();
    } catch (error: any) {
      toast.error('Failed to set reminder', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompleted = async (reminderId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_reminders')
        .update({ completed: !completed })
        .eq('id', reminderId);

      if (error) throw error;
      fetchReminders();
    } catch (error: any) {
      toast.error('Failed to update reminder', {
        description: error.message,
      });
    }
  };

  const handleDelete = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('contact_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;
      toast.success('Reminder deleted');
      fetchReminders();
    } catch (error: any) {
      toast.error('Failed to delete reminder', {
        description: error.message,
      });
    }
  };

  const upcomingReminders = reminders.filter(r => !r.completed && !isPast(new Date(r.reminder_date)));
  const pastReminders = reminders.filter(r => !r.completed && isPast(new Date(r.reminder_date)));
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reminders</CardTitle>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Set Reminder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No reminders set</p>
              <p className="text-xs mt-1">Set a reminder to follow up</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastReminders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-destructive mb-2">Overdue</p>
                  {pastReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-start gap-3 mb-3 p-2 rounded bg-destructive/10">
                      <Checkbox
                        checked={reminder.completed}
                        onCheckedChange={() => handleToggleCompleted(reminder.id, reminder.completed)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-destructive">
                            {format(new Date(reminder.reminder_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {reminder.notes && (
                          <p className="text-sm text-muted-foreground">{reminder.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this reminder?')) {
                            handleDelete(reminder.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {upcomingReminders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Upcoming</p>
                  {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-start gap-3 mb-3 p-2 rounded hover:bg-muted/50">
                      <Checkbox
                        checked={reminder.completed}
                        onCheckedChange={() => handleToggleCompleted(reminder.id, reminder.completed)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reminder.reminder_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {reminder.notes && (
                          <p className="text-sm">{reminder.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this reminder?')) {
                            handleDelete(reminder.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {completedReminders.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Completed</p>
                  {completedReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-start gap-3 mb-3 p-2 rounded opacity-50">
                      <Checkbox
                        checked={reminder.completed}
                        onCheckedChange={() => handleToggleCompleted(reminder.id, reminder.completed)}
                      />
                      <div className="flex-1 space-y-1 line-through">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            {format(new Date(reminder.reminder_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {reminder.notes && (
                          <p className="text-sm">{reminder.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this reminder?')) {
                            handleDelete(reminder.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_date">Reminder Date & Time *</Label>
              <Input
                id="reminder_date"
                type="datetime-local"
                value={formData.reminder_date}
                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_notes">Notes</Label>
              <Textarea
                id="reminder_notes"
                rows={3}
                placeholder="What should you follow up about?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Setting...' : 'Set Reminder'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
