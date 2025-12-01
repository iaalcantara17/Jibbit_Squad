import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Clock, MapPin, Video, Phone, Building, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewWithDetails, InterviewOutcome, InterviewFollowup, getOutcomeBadgeVariant, getStatusBadgeVariant } from '@/types/interviews';
import { InterviewChecklistCard } from '@/components/interviews/InterviewChecklistCard';
import { PostInterviewFollowup } from '@/components/interviews/PostInterviewFollowup';
import { CompanyResearchReport } from '@/components/interviews/CompanyResearchReport';
import { InterviewFollowupTemplates } from '@/components/interviews/InterviewFollowupTemplates';
import { InterviewSuccessScore } from '@/components/interviews/InterviewSuccessScore';
import { downloadICS } from '@/lib/demo/icsExport';

const InterviewDetail = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [interviewId, user]);

  const loadInterview = async () => {
    if (!user || !interviewId) return;

    try {
      setLoading(true);
      
      // Get interview with job details
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*, jobs(id, job_title, company_name)')
        .eq('id', interviewId)
        .eq('user_id', user.id)
        .single();

      if (interviewError) throw interviewError;

      // Get checklists
      const { data: checklistData, error: checklistError } = await supabase
        .from('interview_checklists')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });

      if (checklistError) throw checklistError;

      // Get followups
      const { data: followupData, error: followupError } = await supabase
        .from('interview_followups')
        .select('*')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: false });

      if (followupError) throw followupError;

      setInterview({
        ...interviewData,
        checklists: checklistData || [],
        followups: (followupData || []) as InterviewFollowup[],
      });
    } catch (error) {
      console.error('Error loading interview:', error);
      toast.error('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!interview) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status })
        .eq('id', interview.id);

      if (error) throw error;

      setInterview({ ...interview, status });
      toast.success('Interview status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleOutcomeUpdate = async (outcome: string) => {
    if (!interview) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ outcome })
        .eq('id', interview.id);

      if (error) throw error;

      setInterview({ ...interview, outcome: outcome as InterviewOutcome });
      toast.success('Interview outcome updated');
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast.error('Failed to update outcome');
    } finally {
      setUpdating(false);
    }
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'remote':
        return <Video className="h-5 w-5" />;
      case 'onsite':
        return <Building className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const handleExportToCalendar = () => {
    if (!interview || !interview.scheduled_start || !interview.scheduled_end) {
      toast.error('Interview must have start and end times');
      return;
    }

    const jobTitle = interview.job?.job_title || 'Interview';
    const companyName = interview.job?.company_name || '';
    
    downloadICS({
      summary: `${jobTitle} Interview - ${companyName}`,
      description: `Interview for ${jobTitle} at ${companyName}\nType: ${interview.interview_type || 'Not specified'}\n${interview.video_link ? `Video Link: ${interview.video_link}` : ''}`,
      location: interview.location || interview.video_link || '',
      startTime: new Date(interview.scheduled_start),
      endTime: new Date(interview.scheduled_end),
      uid: `interview-${interview.id}@jobtracker.demo`,
    }, `interview-${companyName.replace(/\s+/g, '-')}.ics`);

    toast.success('Calendar event file downloaded');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Interview Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The interview you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/jobs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const jobTitle = interview.job?.job_title || 'Interview';
  const companyName = interview.job?.company_name || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold mb-2">{jobTitle}</h1>
                <p className="text-xl text-muted-foreground">{companyName}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusBadgeVariant(interview.status || 'scheduled')}>
                  {interview.status || 'scheduled'}
                </Badge>
                <Badge variant={getOutcomeBadgeVariant((interview.outcome as InterviewOutcome) || 'pending')}>
                  {interview.outcome || 'pending'}
                </Badge>
              </div>
            </div>

            {/* Interview Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    {getInterviewIcon(interview.interview_type || '')}
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{interview.interview_type || 'Not specified'}</p>
                    </div>
                  </div>

                  {interview.scheduled_start && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date & Time</p>
                        <p className="font-medium">
                          {format(new Date(interview.scheduled_start), 'PPP')}
                        </p>
                        <p className="text-sm">
                          {format(new Date(interview.scheduled_start), 'p')}
                          {interview.duration_minutes && ` (${interview.duration_minutes} min)`}
                        </p>
                      </div>
                    </div>
                  )}

                  {interview.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{interview.location}</p>
                      </div>
                    </div>
                  )}

                  {interview.video_link && (
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Video Link</p>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium"
                          onClick={() => window.open(interview.video_link!, '_blank')}
                        >
                          Join Meeting
                        </Button>
                      </div>
                    </div>
                  )}

                  {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="h-5 w-5" /> {/* Spacer for alignment */}
                      <div>
                        <p className="text-sm text-muted-foreground">Interviewers</p>
                        <p className="font-medium">{interview.interviewer_names.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {interview.notes && (
                    <div className="md:col-span-2 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & Outcome Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Interview Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select
                      value={interview.status || 'scheduled'}
                      onValueChange={handleStatusUpdate}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Outcome</label>
                    <Select
                      value={interview.outcome || 'pending'}
                      onValueChange={handleOutcomeUpdate}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="pass">Passed / Next Round</SelectItem>
                        <SelectItem value="fail">Not Selected</SelectItem>
                        <SelectItem value="offer">Received Offer</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Export */}
            {interview.scheduled_start && interview.scheduled_end && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add to Calendar</CardTitle>
                  <CardDescription>Download .ics file to import into your calendar app</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExportToCalendar} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Calendar Event (.ics)
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Success Probability Score */}
            {interview.scheduled_start && new Date(interview.scheduled_start) > new Date() && (
              <InterviewSuccessScore 
                interviewId={interview.id}
                interviewDate={interview.scheduled_start}
              />
            )}
          </div>

          <Separator />

          {/* Tabs for different sections */}
          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklist">Preparation</TabsTrigger>
              <TabsTrigger value="research">Company Research</TabsTrigger>
              <TabsTrigger value="followup">Follow-ups</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-6">
              <InterviewChecklistCard 
                interview={interview} 
                onUpdate={loadInterview}
              />
            </TabsContent>

            <TabsContent value="research" className="mt-6">
              <CompanyResearchReport
                interviewId={interview.id}
                companyName={companyName}
                jobTitle={jobTitle}
                currentResearch={interview.company_research}
                onUpdate={loadInterview}
              />
            </TabsContent>

            <TabsContent value="followup" className="mt-6">
              <InterviewFollowupTemplates 
                interview={interview as any}
                onFollowupUpdate={loadInterview}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetail;
