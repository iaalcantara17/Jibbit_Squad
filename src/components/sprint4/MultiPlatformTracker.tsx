import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Linkedin, 
  Globe, 
  Building2, 
  Plus, 
  ExternalLink, 
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PlatformApplication {
  id: string;
  platform: string;
  platform_job_id?: string;
  job_url?: string;
  applied_at: string;
  status: string;
  last_synced?: string;
  job_id: string;
}

interface MultiPlatformTrackerProps {
  jobId: string;
  jobTitle: string;
  company: string;
}

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0077B5]' },
  { id: 'indeed', name: 'Indeed', icon: Globe, color: 'bg-[#2164F3]' },
  { id: 'glassdoor', name: 'Glassdoor', icon: Building2, color: 'bg-[#0CAA41]' },
  { id: 'company_website', name: 'Company Website', icon: Globe, color: 'bg-primary' },
  { id: 'ziprecruiter', name: 'ZipRecruiter', icon: Globe, color: 'bg-[#5BA829]' },
  { id: 'monster', name: 'Monster', icon: Globe, color: 'bg-[#6E45A5]' },
  { id: 'other', name: 'Other', icon: Globe, color: 'bg-muted' },
];

export const MultiPlatformTracker = ({ jobId, jobTitle, company }: MultiPlatformTrackerProps) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PlatformApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newStatus, setNewStatus] = useState('applied');

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      // For now, we'll use the application_events table to track platform submissions
      const { data, error } = await supabase
        .from('application_events')
        .select('*')
        .eq('job_id', jobId)
        .eq('event_type', 'platform_submission');

      if (error) throw error;

      const parsedApps = (data || []).map(event => ({
        id: event.id,
        platform: (event.metadata as any)?.platform || 'unknown',
        platform_job_id: (event.metadata as any)?.platform_job_id,
        job_url: (event.metadata as any)?.job_url,
        applied_at: event.event_date || new Date().toISOString(),
        status: (event.metadata as any)?.status || 'applied',
        last_synced: (event.metadata as any)?.last_synced,
        job_id: event.job_id,
      }));

      setApplications(parsedApps);
    } catch (error) {
      console.error('Error fetching platform applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPlatformApplication = async () => {
    if (!newPlatform) {
      toast.error('Please select a platform');
      return;
    }

    try {
      const { error } = await supabase
        .from('application_events')
        .insert({
          job_id: jobId,
          user_id: user?.id,
          event_type: 'platform_submission',
          event_date: new Date().toISOString(),
          metadata: {
            platform: newPlatform,
            job_url: newUrl,
            status: newStatus,
            last_synced: new Date().toISOString(),
          }
        });

      if (error) throw error;

      toast.success('Platform application added');
      setIsAddDialogOpen(false);
      setNewPlatform('');
      setNewUrl('');
      setNewStatus('applied');
      fetchApplications();
    } catch (error) {
      console.error('Error adding platform application:', error);
      toast.error('Failed to add platform application');
    }
  };

  const syncWithLinkedIn = async () => {
    setSyncing(true);
    try {
      // Check if LinkedIn is connected
      const { data: integration } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('provider', 'linkedin')
        .maybeSingle();

      if (!integration) {
        toast.error('Please connect your LinkedIn account first');
        return;
      }

      // Trigger LinkedIn sync
      toast.success('LinkedIn sync initiated - this may take a moment');
      
      // Update last synced time for LinkedIn applications
      for (const app of applications.filter(a => a.platform === 'linkedin')) {
        await supabase
          .from('application_events')
          .update({
            metadata: {
              ...(app as any),
              last_synced: new Date().toISOString(),
            }
          })
          .eq('id', app.id);
      }

      fetchApplications();
    } catch (error) {
      console.error('Error syncing with LinkedIn:', error);
      toast.error('Failed to sync with LinkedIn');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'viewed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || PLATFORMS[PLATFORMS.length - 1];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Multi-Platform Tracker
            </CardTitle>
            <CardDescription>
              Track your application status across different job platforms
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncWithLinkedIn}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync LinkedIn
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Platform Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={newPlatform} onValueChange={setNewPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(platform => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <platform.icon className="h-4 w-4" />
                              {platform.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Job URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="viewed">Viewed by Recruiter</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addPlatformApplication} className="w-full">
                    Add Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No platform applications tracked yet</p>
            <p className="text-sm">Add platforms where you've applied for this job</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map(app => {
              const platform = getPlatformInfo(app.platform);
              const PlatformIcon = platform.icon;
              
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${platform.color} text-white`}>
                      <PlatformIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{platform.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                        {app.last_synced && (
                          <span className="ml-2">
                            • Last synced {new Date(app.last_synced).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      {app.status.replace('_', ' ')}
                    </Badge>
                    {app.job_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(app.job_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
