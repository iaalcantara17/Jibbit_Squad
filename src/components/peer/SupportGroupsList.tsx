import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Lock, Globe } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SupportGroupDetail } from './SupportGroupDetail';

export const SupportGroupsList = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    group_type: 'general' as 'industry' | 'role' | 'location' | 'general',
    industry: '',
    role: '',
    location: '',
    is_private: false,
  });

  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['support-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const groupsWithCounts = await Promise.all((data || []).map(async (group) => {
        const { count } = await supabase
          .from('support_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);
        return { ...group, member_count: count || 0 };
      }));
      
      return groupsWithCounts;
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: group, error } = await supabase
        .from('support_groups')
        .insert({
          ...newGroup,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('support_group_members').insert({
        group_id: group.id,
        user_id: user.id,
        privacy_level: 'full_profile',
      });

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-groups'] });
      setCreateDialogOpen(false);
      setNewGroup({
        name: '',
        description: '',
        group_type: 'general',
        industry: '',
        role: '',
        location: '',
        is_private: false,
      });
      toast.success('Support group created successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to create group: ' + error.message);
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('support_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        throw new Error('You are already a member of this group');
      }

      const { error } = await supabase.from('support_group_members').insert({
        group_id: groupId,
        user_id: user.id,
        privacy_level: 'anonymous',
      });

      if (error) throw error;
      
      // Update the member_count in support_groups table
      const { count } = await supabase
        .from('support_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);
      
      await supabase
        .from('support_groups')
        .update({ member_count: count || 1 })
        .eq('id', groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-groups'] });
      toast.success('Joined group successfully!');
    },
    onError: (error: any) => {
      if (error.message.includes('already a member')) {
        toast.info(error.message);
      } else {
        toast.error('Failed to join group: ' + error.message);
      }
    },
  });

  if (selectedGroupId) {
    return (
      <SupportGroupDetail 
        groupId={selectedGroupId} 
        onBack={() => setSelectedGroupId(null)} 
      />
    );
  }

  if (isLoading) {
    return <div>Loading support groups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Support Groups</h2>
          <p className="text-muted-foreground">Join industry, role, or location-based peer communities</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Support Group</DialogTitle>
              <DialogDescription>
                Start a new peer community to share insights and support
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g., Software Engineers - Bay Area"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Describe the group's purpose"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Group Type</Label>
                <Select
                  value={newGroup.group_type}
                  onValueChange={(v: any) => setNewGroup({ ...newGroup, group_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newGroup.group_type === 'industry' && (
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newGroup.industry}
                    onChange={(e) => setNewGroup({ ...newGroup, industry: e.target.value })}
                    placeholder="e.g., Technology"
                  />
                </div>
              )}
              {newGroup.group_type === 'role' && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={newGroup.role}
                    onChange={(e) => setNewGroup({ ...newGroup, role: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              )}
              {newGroup.group_type === 'location' && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newGroup.location}
                    onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newGroup.is_private}
                  onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="private" className="cursor-pointer">
                  Private group (invite-only)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createGroupMutation.mutate()} disabled={!newGroup.name}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {groups?.map((group) => (
          <Card 
            key={group.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedGroupId(group.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {group.name}
                    {group.is_private ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{group.description}</CardDescription>
                </div>
                <Badge variant="secondary">{group.group_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.member_count} members</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    joinGroupMutation.mutate(group.id);
                  }}
                >
                  Join Group
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No support groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a peer community
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
