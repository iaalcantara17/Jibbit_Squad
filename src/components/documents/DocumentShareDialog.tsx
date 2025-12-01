import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'resume' | 'cover_letter';
  documentId: string;
}

interface Share {
  id: string;
  shared_with_user_id: string;
  permission: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
}

export const DocumentShareDialog = ({
  open,
  onOpenChange,
  documentType,
  documentId,
}: DocumentShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'comment'>('comment');
  const queryClient = useQueryClient();

  const { data: shares = [] } = useQuery({
    queryKey: ['document-shares', documentType, documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_shares_internal')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId);
      if (error) throw error;
      return data as Share[];
    },
    enabled: open,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-shares', shares.map(s => s.shared_with_user_id)],
    queryFn: async () => {
      if (shares.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', shares.map(s => s.shared_with_user_id));
      if (error) throw error;
      return data as Profile[];
    },
    enabled: shares.length > 0,
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find user by email
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profileError || !targetProfile) {
        throw new Error('User not found');
      }

      const { error } = await supabase
        .from('document_shares_internal')
        .insert({
          owner_id: user.id,
          shared_with_user_id: targetProfile.user_id,
          document_type: documentType,
          document_id: documentId,
          permission,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document shared successfully');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['document-shares'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to share document');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from('document_shares_internal')
        .delete()
        .eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Share removed');
      queryClient.invalidateQueries({ queryKey: ['document-shares'] });
    },
    onError: () => {
      toast.error('Failed to remove share');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission</Label>
            <Select
              value={permission}
              onValueChange={(v) => setPermission(v as 'view' | 'comment')}
            >
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View only</SelectItem>
                <SelectItem value="comment">Can comment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => shareMutation.mutate()}
            disabled={!email || shareMutation.isPending}
            className="w-full"
          >
            {shareMutation.isPending ? 'Sharing...' : 'Share Document'}
          </Button>

          {shares.length > 0 && (
            <div className="space-y-2 mt-6">
              <h4 className="font-semibold text-sm">Shared With</h4>
              <div className="space-y-2">
                {shares.map((share) => {
                  const profile = profiles.find(p => p.user_id === share.shared_with_user_id);
                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {profile?.name || profile?.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={share.permission === 'comment' ? 'default' : 'secondary'}>
                          {share.permission}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(share.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
