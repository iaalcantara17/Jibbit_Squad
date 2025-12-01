import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Share2, Copy, Trash2, Eye, EyeOff, Clock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProgressShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Share {
  id: string;
  share_token: string;
  scope: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  shared_with_name: string | null;
  notes: string | null;
  last_accessed_at: string | null;
}

const scopeDescriptions = {
  kpi_summary: {
    title: 'KPI Summary Only',
    description: 'Shows overall metrics without sensitive details like company names or salary',
    privacy: 'High Privacy',
  },
  goals_only: {
    title: 'Goals Only',
    description: 'Shows goals, milestones, and progress without application details',
    privacy: 'High Privacy',
  },
  full_progress: {
    title: 'Full Progress',
    description: 'Complete access to all progress data (recommended for team members only)',
    privacy: 'Low Privacy',
  },
};

export const ProgressShareDialog = ({ open, onOpenChange }: ProgressShareDialogProps) => {
  const [sharedWithName, setSharedWithName] = useState('');
  const [scope, setScope] = useState<'kpi_summary' | 'goals_only' | 'full_progress'>('kpi_summary');
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: shares = [] } = useQuery({
    queryKey: ['progress-shares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_shares')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Share[];
    },
    enabled: open,
  });

  const createShareMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const shareToken = crypto.randomUUID();
      const expiresAt = expiryDays > 0 
        ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('progress_shares')
        .insert({
          user_id: user.id,
          share_token: shareToken,
          scope,
          expires_at: expiresAt,
          shared_with_name: sharedWithName || null,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Share link created');
      setSharedWithName('');
      setNotes('');
      setScope('kpi_summary');
      queryClient.invalidateQueries({ queryKey: ['progress-shares'] });
    },
    onError: () => {
      toast.error('Failed to create share link');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('progress_shares')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-shares'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('progress_shares')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Share link deleted');
      queryClient.invalidateQueries({ queryKey: ['progress-shares'] });
    },
  });

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/progress/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Progress
          </DialogTitle>
          <DialogDescription>
            Create accountability links with explicit privacy controls
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy First:</strong> All shares default to maximum privacy.
            Only share "Full Progress" with trusted team members.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 border-b pb-6">
          <div className="space-y-2">
            <Label htmlFor="name">Shared With (Optional)</Label>
            <Input
              id="name"
              placeholder="Friend, Family Member, or Coach"
              value={sharedWithName}
              onChange={(e) => setSharedWithName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Privacy Scope</Label>
            <Select value={scope} onValueChange={(v: any) => setScope(v)}>
              <SelectTrigger id="scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(scopeDescriptions).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{info.title}</span>
                      <Badge variant={info.privacy === 'High Privacy' ? 'default' : 'destructive'} className="ml-2">
                        {info.privacy}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {scopeDescriptions[scope].description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expires In (Days)</Label>
            <Select value={expiryDays.toString()} onValueChange={(v) => setExpiryDays(parseInt(v))}>
              <SelectTrigger id="expiry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Why are you sharing this?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={() => createShareMutation.mutate()}
            disabled={createShareMutation.isPending}
            className="w-full"
          >
            {createShareMutation.isPending ? 'Creating...' : 'Create Share Link'}
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Active Shares ({shares.filter(s => s.is_active).length})</h4>
          {shares.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No shares yet</p>
          ) : (
            shares.map((share) => (
              <Card key={share.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">
                          {share.shared_with_name || 'Unnamed Share'}
                        </h5>
                        <Badge variant={share.is_active ? 'default' : 'secondary'}>
                          {share.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{scopeDescriptions[share.scope as keyof typeof scopeDescriptions].title}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {format(new Date(share.created_at), 'MMM d, yyyy')}
                        {share.expires_at && ` • Expires ${format(new Date(share.expires_at), 'MMM d, yyyy')}`}
                      </p>
                      {share.last_accessed_at && (
                        <p className="text-xs text-muted-foreground">
                          Last accessed {format(new Date(share.last_accessed_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                      {share.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{share.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActiveMutation.mutate({ id: share.id, isActive: !share.is_active })}
                      >
                        {share.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(share.share_token)}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
