import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewWithDetails, FollowupType, InterviewFollowup } from '@/types/interviews';
import { format } from 'date-fns';

interface PostInterviewFollowupProps {
  interview: InterviewWithDetails;
  onUpdate: () => void;
}

export const PostInterviewFollowup = ({ interview, onUpdate }: PostInterviewFollowupProps) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [followupType, setFollowupType] = useState<FollowupType>('thank_you');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const followups = interview.followups || [];

  const followupTypeLabels: Record<FollowupType, string> = {
    thank_you: 'Thank You Note',
    status_check: 'Status Check-In',
    feedback_request: 'Feedback Request',
    network_followup: 'Network Follow-Up',
  };

  const followupTypeTemplates: Record<FollowupType, { subject: string; body: string }> = {
    thank_you: {
      subject: `Thank you for the interview - ${interview.job?.job_title || 'Position'}`,
      body: `Dear [Interviewer Name],\n\nThank you for taking the time to speak with me about the ${interview.job?.job_title || 'position'} at ${interview.job?.company_name || 'your company'}. I enjoyed our conversation and learning more about the role and team.\n\nI'm very excited about the opportunity to contribute to [specific project/initiative discussed]. My background in [relevant experience] aligns well with the responsibilities we discussed.\n\nPlease let me know if you need any additional information from me. I look forward to hearing about the next steps.\n\nBest regards,\n[Your Name]`,
    },
    status_check: {
      subject: `Following up on ${interview.job?.job_title || 'interview'}`,
      body: `Dear [Hiring Manager Name],\n\nI hope this message finds you well. I wanted to follow up on my interview for the ${interview.job?.job_title || 'position'} at ${interview.job?.company_name || 'your company'}.\n\nI remain very interested in this opportunity and wanted to check on the status of the hiring process. Please let me know if there's any additional information I can provide.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`,
    },
    feedback_request: {
      subject: `Request for feedback on interview`,
      body: `Dear [Interviewer Name],\n\nThank you again for the opportunity to interview for the ${interview.job?.job_title || 'position'}. While I understand the role has been filled, I would greatly appreciate any feedback you could share about my interview performance.\n\nYour insights would be valuable as I continue my job search and professional development. Even brief feedback would be helpful.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`,
    },
    network_followup: {
      subject: `Great connecting with you`,
      body: `Dear [Name],\n\nIt was a pleasure meeting you during my interview at ${interview.job?.company_name || 'the company'}. I really enjoyed our conversation about [specific topic discussed].\n\nI'd love to stay connected and learn more about your work in [their area]. Would you be open to connecting on LinkedIn?\n\nThank you again for your time and insights.\n\nBest regards,\n[Your Name]`,
    },
  };

  const handleTypeChange = (type: FollowupType) => {
    setFollowupType(type);
    const template = followupTypeTemplates[type];
    setSubject(template.subject);
    setBody(template.body);
  };

  const handleAddFollowup = async () => {
    if (!user || !subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('interview_followups')
        .insert({
          interview_id: interview.id,
          user_id: user.id,
          type: followupType,
          template_subject: subject.trim(),
          template_body: body.trim(),
          status: 'draft',
        });

      if (error) throw error;

      toast.success('Follow-up task created');
      setShowAddForm(false);
      setSubject('');
      setBody('');
      onUpdate();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      toast.error('Failed to create follow-up task');
    } finally {
      setIsAdding(false);
    }
  };

  const handleMarkAsSent = async (followupId: string) => {
    try {
      const { error } = await supabase
        .from('interview_followups')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', followupId);

      if (error) throw error;

      toast.success('Follow-up marked as sent');
      onUpdate();
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post-Interview Follow-Up Tasks</CardTitle>
        <CardDescription>
          Create follow-up reminders and draft communications (emails will not be sent automatically)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Followups */}
        {followups.length > 0 && (
          <div className="space-y-3">
            {followups.map((followup) => (
              <div
                key={followup.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(followup.status)}
                      <h4 className="font-medium">{followupTypeLabels[followup.type]}</h4>
                      <Badge variant={followup.status === 'sent' ? 'default' : 'secondary'}>
                        {followup.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {followup.template_subject}
                    </p>
                    {followup.sent_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sent {format(new Date(followup.sent_at), 'PPp')}
                      </p>
                    )}
                  </div>
                  {followup.status !== 'sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsSent(followup.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Mark as Sent
                    </Button>
                  )}
                </div>
                {followup.template_body && (
                  <details className="mt-2">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      View template
                    </summary>
                    <div className="mt-2 p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                      {followup.template_body}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Follow-Up Form */}
        {showAddForm ? (
          <div className="space-y-3 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">Follow-up Type</label>
              <Select value={followupType} onValueChange={(v) => handleTypeChange(v as FollowupType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(followupTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Template</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body template..."
                rows={10}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Note: This creates a draft template only. You'll need to copy and send the email manually.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddFollowup} disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Follow-Up Task
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setSubject('');
                  setBody('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setShowAddForm(true);
              handleTypeChange('thank_you'); // Set initial template
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Follow-Up Task
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
