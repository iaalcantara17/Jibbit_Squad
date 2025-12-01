import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Send, CheckCircle, Mail, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Interview {
  id: string;
  job_id: string;
  interview_date: string | null;
  interviewer_names: string[] | null;
  notes: string | null;
  jobs?: {
    job_title: string;
    company_name: string;
  };
}

interface Followup {
  id: string;
  type: string;
  template_subject: string | null;
  template_body: string | null;
  status: string;
  sent_at: string | null;
}

interface InterviewFollowupTemplatesProps {
  interview: Interview;
  onFollowupUpdate?: () => void;
}

const TEMPLATE_TYPES = [
  { value: 'thank-you', label: 'Thank You Note', timing: 'Send within 24 hours' },
  { value: 'status-inquiry', label: 'Status Inquiry', timing: 'Send after 1-2 weeks' },
  { value: 'feedback-request', label: 'Feedback Request', timing: 'Send if rejected' },
  { value: 'networking', label: 'Networking Follow-up', timing: 'Send after rejection' },
];

export function InterviewFollowupTemplates({ interview, onFollowupUpdate }: InterviewFollowupTemplatesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [selectedType, setSelectedType] = useState('thank-you');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasEmailIntegration, setHasEmailIntegration] = useState(false);
  const [responseOutcome, setResponseOutcome] = useState<string>('');

  useEffect(() => {
    loadFollowups();
    checkEmailIntegration();
  }, [interview.id]);

  useEffect(() => {
    generateTemplate();
  }, [selectedType, interview]);

  const loadFollowups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('interview_followups')
        .select('*')
        .eq('interview_id', interview.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowups(data || []);
    } catch (error) {
      console.error('Error loading followups:', error);
    }
  };

  const checkEmailIntegration = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_integrations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setHasEmailIntegration(true);
      }
    } catch (error) {
      console.error('Error checking email integration:', error);
    }
  };

  const generateTemplate = () => {
    const interviewerName = interview.interviewer_names?.[0] || 'the interviewer';
    const jobTitle = interview.jobs?.job_title || 'the position';
    const companyName = interview.jobs?.company_name || 'your company';
    const conversationNotes = interview.notes || 'our discussion';

    let templateSubject = '';
    let templateBody = '';

    switch (selectedType) {
      case 'thank-you':
        templateSubject = `Thank you for the ${jobTitle} interview`;
        templateBody = `Dear ${interviewerName},

Thank you for taking the time to meet with me yesterday regarding the ${jobTitle} position at ${companyName}. I enjoyed learning more about the role and the team.

I was particularly interested in ${conversationNotes}. The conversation reinforced my enthusiasm for the opportunity and my belief that I would be a strong fit for the team.

Please let me know if you need any additional information from me. I look forward to hearing about the next steps in the process.

Best regards,
[Your Name]`;
        break;

      case 'status-inquiry':
        templateSubject = `Following up on ${jobTitle} interview`;
        templateBody = `Dear ${interviewerName},

I hope this message finds you well. I wanted to follow up on my interview for the ${jobTitle} position at ${companyName}.

I remain very interested in the opportunity and would appreciate any update on the hiring timeline and next steps in the process.

Thank you for your time and consideration.

Best regards,
[Your Name]`;
        break;

      case 'feedback-request':
        templateSubject = `Request for feedback - ${jobTitle} interview`;
        templateBody = `Dear ${interviewerName},

Thank you for considering me for the ${jobTitle} position at ${companyName}. While I'm disappointed not to move forward, I'm committed to continuous improvement.

If possible, I would greatly appreciate any feedback you could share about my interview or application. Any insights would be valuable as I continue my job search.

Thank you again for the opportunity and your time.

Best regards,
[Your Name]`;
        break;

      case 'networking':
        templateSubject = `Staying connected - ${companyName}`;
        templateBody = `Dear ${interviewerName},

Thank you for the opportunity to interview for the ${jobTitle} position at ${companyName}. While I understand the role wasn't the right fit, I greatly enjoyed learning about your work and the company.

I'd love to stay connected and hear about future opportunities that might be a better match. I'm also happy to be a resource if there's any way I can be helpful to you or the team.

Best regards,
[Your Name]`;
        break;
    }

    setSubject(templateSubject);
    setBody(templateBody);
  };

  const copyToClipboard = async () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: 'Copied to clipboard',
        description: 'Follow-up template has been copied',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const saveFollowup = async (status: string) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('interview_followups')
        .insert({
          interview_id: interview.id,
          user_id: user.id,
          type: selectedType,
          template_subject: subject,
          template_body: body,
          status,
          ...(status === 'sent' && { sent_at: new Date().toISOString() }),
        });

      if (error) throw error;

      toast({
        title: 'Follow-up saved',
        description: status === 'sent' ? 'Marked as sent' : 'Saved as draft',
      });

      loadFollowups();
      onFollowupUpdate?.();
    } catch (error) {
      console.error('Error saving followup:', error);
      toast({
        title: 'Error',
        description: 'Failed to save follow-up',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFollowupOutcome = async (followupId: string, outcome: string) => {
    try {
      const { error } = await supabase
        .from('interview_followups')
        .update({ status: outcome })
        .eq('id', followupId);

      if (error) throw error;

      toast({
        title: 'Outcome updated',
        description: 'Follow-up response outcome has been recorded',
      });

      loadFollowups();
      onFollowupUpdate?.();
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast({
        title: 'Error',
        description: 'Failed to update outcome',
        variant: 'destructive',
      });
    }
  };

  const templateType = TEMPLATE_TYPES.find(t => t.value === selectedType);

  return (
    <div className="space-y-6">
      {/* Generate New Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Follow-up Email</CardTitle>
          <CardDescription>
            Create a personalized follow-up email using interview details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Follow-up Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.timing}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templateType && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {templateType.timing}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Replace [Your Name] with your actual name before sending
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={!subject || !body}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              onClick={() => saveFollowup('draft')}
              disabled={saving || !subject || !body}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => saveFollowup('sent')}
              disabled={saving || !subject || !body}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark as Sent
            </Button>
            {hasEmailIntegration && (
              <Button
                variant="default"
                disabled
                className="bg-primary/50"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Email (Coming Soon)
              </Button>
            )}
          </div>

          {!hasEmailIntegration && (
            <p className="text-xs text-muted-foreground">
              Connect your email to send directly from the app. For now, copy the template and send it from your email client.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sent Follow-ups */}
      {followups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up History</CardTitle>
            <CardDescription>
              Track your sent follow-ups and response outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {followups.map((followup) => (
                <div key={followup.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {TEMPLATE_TYPES.find(t => t.value === followup.type)?.label || followup.type}
                        </Badge>
                        {followup.status === 'sent' && (
                          <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Sent
                          </Badge>
                        )}
                        {followup.status === 'draft' && (
                          <Badge variant="secondary">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {followup.template_subject}
                      </p>
                      {followup.sent_at && (
                        <p className="text-xs text-muted-foreground">
                          Sent {format(new Date(followup.sent_at), 'PPP')}
                        </p>
                      )}
                    </div>
                  </div>

                  {followup.status === 'sent' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Response Outcome</Label>
                      <Select
                        value={followup.status}
                        onValueChange={(value) => updateFollowupOutcome(followup.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sent">No Response Yet</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                          <SelectItem value="positive">Positive Response</SelectItem>
                          <SelectItem value="negative">Negative Response</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View template
                    </summary>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="font-medium mb-2">Subject: {followup.template_subject}</p>
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {followup.template_body}
                      </pre>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}