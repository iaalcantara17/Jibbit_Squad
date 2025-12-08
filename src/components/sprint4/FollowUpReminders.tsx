import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Clock, 
  Mail, 
  Check, 
  X, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays, addDays } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface FollowUpRemindersProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  appliedDate?: string;
}

interface Reminder {
  id: string;
  reminder_type: string;
  scheduled_date: string;
  email_template: string;
  notes: string;
  completed_at: string | null;
  snoozed_until: string | null;
  dismissed_at: string | null;
}

const ETIQUETTE_TIPS = [
  "Wait at least 1 week after applying before following up",
  "Keep follow-up emails brief and professional",
  "Reference your application date and the specific role",
  "Express continued interest without being pushy",
  "Avoid following up more than once per week",
  "Use business hours (9 AM - 5 PM) for sending emails"
];

export const FollowUpReminders = ({ 
  jobId, 
  jobTitle, 
  companyName, 
  applicationStatus,
  appliedDate 
}: FollowUpRemindersProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplate, setShowTemplate] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);

      // If no reminders exist, auto-generate based on application stage
      if (!data || data.length === 0) {
        await generateReminders();
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReminders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('smart-followup', {
        body: { 
          jobId, 
          jobTitle, 
          companyName, 
          applicationStatus,
          appliedDate 
        }
      });

      if (error) throw error;
      if (data?.reminders) {
        setReminders(data.reminders);
      }
    } catch (err) {
      console.error('Failed to generate reminders:', err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [jobId, applicationStatus]);

  const handleComplete = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('follow_up_reminders')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) throw error;
      
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, completed_at: new Date().toISOString() } : r
      ));
      toast.success('Follow-up marked as complete');
    } catch (err) {
      toast.error('Failed to update reminder');
    }
  };

  const handleSnooze = async (reminderId: string, days: number) => {
    try {
      const snoozedUntil = addDays(new Date(), days).toISOString();
      const { error } = await supabase
        .from('follow_up_reminders')
        .update({ snoozed_until: snoozedUntil })
        .eq('id', reminderId);

      if (error) throw error;
      
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, snoozed_until: snoozedUntil } : r
      ));
      toast.success(`Snoozed for ${days} days`);
    } catch (err) {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleDismiss = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('follow_up_reminders')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) throw error;
      
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      toast.success('Reminder dismissed');
    } catch (err) {
      toast.error('Failed to dismiss reminder');
    }
  };

  const copyTemplate = (template: string) => {
    navigator.clipboard.writeText(template);
    toast.success('Template copied to clipboard');
  };

  const isRejected = applicationStatus?.toLowerCase().includes('reject');

  if (isRejected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Follow-Up Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Follow-up reminders are disabled for rejected applications.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Follow-Up Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeReminders = reminders.filter(r => !r.completed_at);
  const completedReminders = reminders.filter(r => r.completed_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Follow-Up Reminders
          {activeReminders.length > 0 && (
            <Badge variant="secondary">{activeReminders.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Smart reminders based on your application status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Etiquette Tips */}
        <Collapsible open={showTips} onOpenChange={setShowTips}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                <span className="text-sm">Follow-up Etiquette Tips</span>
              </div>
              {showTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              {ETIQUETTE_TIPS.map((tip, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">• {tip}</p>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Reminders */}
        {activeReminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active reminders. They will be generated based on your application progress.
          </p>
        ) : (
          <div className="space-y-3">
            {activeReminders.map((reminder) => {
              const isOverdue = new Date(reminder.scheduled_date) < new Date();
              const isSnoozed = reminder.snoozed_until && new Date(reminder.snoozed_until) > new Date();
              
              return (
                <div 
                  key={reminder.id} 
                  className={`p-3 border rounded-lg space-y-2 ${isOverdue && !isSnoozed ? 'border-warning bg-warning/5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isOverdue && !isSnoozed ? 'text-warning' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{reminder.reminder_type}</span>
                    </div>
                    <Badge variant={isOverdue && !isSnoozed ? 'destructive' : 'outline'}>
                      {format(new Date(reminder.scheduled_date), 'MMM d')}
                    </Badge>
                  </div>

                  {isSnoozed && (
                    <p className="text-xs text-muted-foreground">
                      Snoozed until {format(new Date(reminder.snoozed_until!), 'MMM d')}
                    </p>
                  )}

                  {reminder.notes && (
                    <p className="text-sm text-muted-foreground">{reminder.notes}</p>
                  )}

                  {/* Email Template */}
                  {reminder.email_template && (
                    <Collapsible 
                      open={showTemplate === reminder.id} 
                      onOpenChange={() => setShowTemplate(showTemplate === reminder.id ? null : reminder.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="text-xs">View Email Template</span>
                          </div>
                          {showTemplate === reminder.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="relative">
                          <Textarea 
                            value={reminder.email_template} 
                            readOnly 
                            className="text-xs min-h-[100px]"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => copyTemplate(reminder.email_template)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleComplete(reminder.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Done
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSnooze(reminder.id, 3)}
                    >
                      Snooze 3d
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDismiss(reminder.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Reminders */}
        {completedReminders.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
                <span className="text-xs">{completedReminders.length} completed</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {completedReminders.map((reminder) => (
                <div key={reminder.id} className="p-2 bg-muted/30 rounded text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-3 w-3 text-success" />
                  <span>{reminder.reminder_type}</span>
                  <span className="text-xs ml-auto">
                    {format(new Date(reminder.completed_at!), 'MMM d')}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={generateReminders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate Reminders
        </Button>
      </CardContent>
    </Card>
  );
};
