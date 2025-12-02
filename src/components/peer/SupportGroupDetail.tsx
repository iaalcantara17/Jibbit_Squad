import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, MessageSquare, Plus, Lock, Globe, User, Clock, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SupportGroupDetailProps {
  groupId: string;
  onBack: () => void;
}

export const SupportGroupDetail = ({ groupId, onBack }: SupportGroupDetailProps) => {
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'insight' as string,
    is_anonymous: false,
  });

  const queryClient = useQueryClient();

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['support-group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch members with profile names
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['support-group-members', groupId],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from('support_group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profiles for members
      const userIds = membersData?.map(m => m.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      
      return membersData?.map(member => ({
        ...member,
        profile_name: profileMap.get(member.user_id) || null,
      })) || [];
    },
  });

  // Fetch posts with author names
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['support-group-posts', groupId],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profiles for post authors
      const userIds = postsData?.map(p => p.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      
      return postsData?.map(post => ({
        ...post,
        author_name: profileMap.get(post.user_id) || null,
      })) || [];
    },
  });

  // Check if current user is a member
  const { data: currentMembership } = useQuery({
    queryKey: ['support-group-membership', groupId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('support_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          post_type: newPost.post_type,
          is_anonymous: newPost.is_anonymous,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-group-posts', groupId] });
      setCreatePostDialogOpen(false);
      setNewPost({ title: '', content: '', post_type: 'discussion', is_anonymous: false });
      toast.success('Post created successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to create post: ' + error.message);
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          privacy_level: 'anonymous',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['support-group-members', groupId] });
      toast.success('Joined group successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to join group: ' + error.message);
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['support-group-members', groupId] });
      toast.success('Left group successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to leave group: ' + error.message);
    },
  });

  if (groupLoading) {
    return <div>Loading group...</div>;
  }

  if (!group) {
    return <div>Group not found</div>;
  }

  const isMember = !!currentMembership;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">{group.name}</h2>
            {group.is_private ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Globe className="h-5 w-5 text-muted-foreground" />
            )}
            <Badge variant="secondary">{group.group_type}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{group.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {members?.length || 0} members
            </span>
          </div>
        </div>
        <div>
          {isMember ? (
            <Button variant="outline" onClick={() => leaveGroupMutation.mutate()}>
              Leave Group
            </Button>
          ) : (
            <Button onClick={() => joinGroupMutation.mutate()}>
              Join Group
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Posts ({posts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members ({members?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 mt-4">
          {isMember && (
            <Dialog open={createPostDialogOpen} onOpenChange={setCreatePostDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                  <DialogDescription>
                    Share updates, ask questions, or start a discussion
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="post-title">Title</Label>
                    <Input
                      id="post-title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="What's on your mind?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post-content">Content</Label>
                    <Textarea
                      id="post-content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Share your thoughts..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post-type">Post Type</Label>
                    <Select
                      value={newPost.post_type}
                      onValueChange={(v) => setNewPost({ ...newPost, post_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insight">Insight</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                        <SelectItem value="success_story">Success Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={newPost.is_anonymous}
                      onChange={(e) => setNewPost({ ...newPost, is_anonymous: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="anonymous" className="cursor-pointer">
                      Post anonymously
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreatePostDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createPostMutation.mutate()} 
                    disabled={!newPost.title || !newPost.content}
                  >
                    Post
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {!isMember && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">Join this group to view and create posts</p>
              </CardContent>
            </Card>
          )}

          {isMember && postsLoading && <div>Loading posts...</div>}

          {isMember && posts?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          )}

          {isMember && posts?.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {post.is_anonymous ? '?' : (post.author_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.is_anonymous ? 'Anonymous' : (post.author_name || 'Member')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{post.post_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.reaction_count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="members" className="space-y-4 mt-4">
          {membersLoading && <div>Loading members...</div>}

          {members?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                <p className="text-muted-foreground">Be the first to join!</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {members?.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {member.privacy_level === 'anonymous' ? '?' : (member.profile_name?.[0]?.toUpperCase() || <User className="h-6 w-6" />)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.privacy_level === 'anonymous' 
                        ? 'Anonymous Member' 
                        : (member.profile_name || 'Community Member')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="secondary">{member.privacy_level}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
