import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Calendar, Check, Copy, RefreshCw } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface ContactReminder {
  id: string;
  contact_id: string;
  reminder_date: string;
  notes?: string;
  completed: boolean;
  contact: {
    name: string;
    company?: string;
    relationship_strength?: number;
    last_contacted_at?: string;
  };
}

const outreachTemplates = [
  {
    title: "Quick Check-in",
    content: "Hey [Name], hope you're doing well! Just wanted to check in and see how things are going at [Company]. Would love to catch up soon if you have time."
  },
  {
    title: "Share Resource",
    content: "Hi [Name], I came across this [article/resource] and thought of you given your work in [their field]. Hope you find it interesting!"
  },
  {
    title: "Congratulations",
    content: "Congrats on [recent achievement/milestone]! Really impressive. Would love to hear more about it when you have a chance."
  }
];

export const RelationshipMaintenance = () => {
  const [reminders, setReminders] = useState<ContactReminder[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchReminders();
    fetchContactsNeedingOutreach();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_reminders')
        .select('*, contact:contacts(name, company, relationship_strength, last_contacted_at)')
        .eq('completed', false)
        .order('reminder_date');

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactsNeedingOutreach = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, company, relationship_strength, last_contacted_at')
        .order('last_contacted_at', { ascending: true, nullsFirst: true });

      if (error) throw error;
      
      // Filter contacts that need outreach based on relationship strength
      const contactsNeedingOutreach = (data || []).filter(contact => {
        if (!contact.last_contacted_at) return true;
        
        const daysSinceContact = differenceInDays(new Date(), new Date(contact.last_contacted_at));
        const strength = contact.relationship_strength || 3;
        
        // Higher strength = more frequent contact recommended
        const thresholdDays = {
          5: 30,  // Strong relationships: monthly
          4: 45,  // Good relationships: ~1.5 months
          3: 60,  // Medium relationships: 2 months
          2: 90,  // Weak relationships: 3 months
          1: 120  // Very weak: 4 months
        }[strength] || 60;
        
        return daysSinceContact > thresholdDays;
      });

      setContacts(contactsNeedingOutreach);
    } catch (error: any) {
      toast.error('Failed to analyze contacts');
    }
  };

  const generateReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const remindersToCreate = contacts.slice(0, 10).map(contact => {
        const strength = contact.relationship_strength || 3;
        const daysUntilReminder = {
          5: 7,
          4: 10,
          3: 14,
          2: 21,
          1: 30
        }[strength] || 14;

        return {
          user_id: user.id,
          contact_id: contact.id,
          reminder_date: format(addDays(new Date(), daysUntilReminder), 'yyyy-MM-dd'),
          notes: `Check in with ${contact.name}`,
          completed: false,
        };
      });

      const { error } = await supabase
        .from('contact_reminders')
        .insert(remindersToCreate);

      if (error) throw error;

      toast.success(`Created ${remindersToCreate.length} reminders`);
      fetchReminders();
      fetchContactsNeedingOutreach();
    } catch (error: any) {
      toast.error('Failed to generate reminders', { description: error.message });
    }
  };

  const completeReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('contact_reminders')
        .update({ completed: true })
        .eq('id', reminderId);

      if (error) throw error;

      toast.success('Reminder completed');
      fetchReminders();
    } catch (error: any) {
      toast.error('Failed to complete reminder');
    }
  };

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copied to clipboard');
  };

  const getDaysOverdue = (reminderDate: string) => {
    const days = differenceInDays(new Date(), new Date(reminderDate));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relationship Maintenance</CardTitle>
              <CardDescription>Auto-generated check-in reminders based on relationship strength</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplates(true)}>
                View Templates
              </Button>
              <Button onClick={generateReminders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Reminders
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Contacts Needing Outreach</h3>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All contacts recently engaged! 🎉</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {contacts.slice(0, 10).map(contact => (
                    <Badge key={contact.id} variant="secondary">
                      {contact.name}
                      {contact.last_contacted_at && (
                        <span className="ml-1 text-xs opacity-70">
                          ({differenceInDays(new Date(), new Date(contact.last_contacted_at))}d ago)
                        </span>
                      )}
                    </Badge>
                  ))}
                  {contacts.length > 10 && (
                    <Badge variant="outline">+{contacts.length - 10} more</Badge>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Upcoming Reminders</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
                  ))}
                </div>
              ) : reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No reminders scheduled. Click "Generate Reminders" to create check-in tasks.
                </p>
              ) : (
                <div className="space-y-2">
                  {reminders.map((reminder) => {
                    const daysOverdue = getDaysOverdue(reminder.reminder_date);
                    return (
                      <Card key={reminder.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{reminder.contact.name}</h4>
                                {daysOverdue > 0 && (
                                  <Badge variant="destructive">{daysOverdue}d overdue</Badge>
                                )}
                              </div>
                              {reminder.contact.company && (
                                <p className="text-sm text-muted-foreground">{reminder.contact.company}</p>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(reminder.reminder_date), 'MMM d, yyyy')}
                              </div>
                              {reminder.notes && (
                                <p className="text-sm mt-1">{reminder.notes}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => completeReminder(reminder.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Outreach Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {outreachTemplates.map((template, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyTemplate(template.content)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {template.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};