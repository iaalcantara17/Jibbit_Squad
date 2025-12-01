// UC-113: Family support dashboard with two-way communication

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Send, MessageCircle, Bell, Settings, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function FamilySupportDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUpdate, setNewUpdate] = useState('');
  const [updateType, setUpdateType] = useState<'milestone' | 'progress' | 'achievement' | 'general'>('general');

  // Fetch supporters
  const { data: supporters } = useQuery({
    queryKey: ['family-supporters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_supporters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch messages from supporters
  const { data: messages } = useQuery({
    queryKey: ['supporter-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supporter_messages')
        .select(`
          *,
          family_supporters!supporter_messages_supporter_id_fkey(supporter_name, relationship)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's updates
  const { data: updates } = useQuery({
    queryKey: ['user-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Post new update
  const postUpdate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_updates')
        .insert({
          user_id: user.id,
          update_text: newUpdate,
          update_type: updateType,
          visibility: 'all_supporters',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-updates'] });
      setNewUpdate('');
      toast({
        title: 'Update Posted',
        description: 'Your family supporters have been notified',
      });
    },
  });

  // Mark message as read
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('supporter_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supporter-messages'] });
    },
  });

  const unreadCount = messages?.filter(m => !m.is_read).length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Family & Personal Support
          </CardTitle>
          <CardDescription>
            Share your progress and receive encouragement from your support network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <UserPlus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{supporters?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Active Supporters</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{unreadCount}</div>
                <div className="text-sm text-muted-foreground">Unread Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{updates?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Updates Shared</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates">My Updates</TabsTrigger>
          <TabsTrigger value="messages">
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="supporters">Supporters</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share an Update</CardTitle>
              <CardDescription>
                Keep your supporters informed about your job search progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(['milestone', 'progress', 'achievement', 'general'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={updateType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUpdateType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Share your progress, milestones, or thoughts..."
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={() => postUpdate.mutate()}
                disabled={!newUpdate.trim() || postUpdate.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Update
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {updates?.map((update) => (
              <Card key={update.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <Badge>{update.update_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{update.update_text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-3">
          {messages?.map((message) => (
            <Card 
              key={message.id}
              className={!message.is_read ? 'border-primary' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">
                      {(message.family_supporters as any)?.supporter_name || 'Supporter'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(message.family_supporters as any)?.relationship || 'Family'}
                    </div>
                  </div>
                  <div className="text-right">
                    {!message.is_read && (
                      <Badge variant="default" className="mb-1">New</Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-2">{message.message_text}</p>
                {!message.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => markAsRead.mutate(message.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {messages?.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="supporters" className="space-y-3">
          <Button className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Supporter
          </Button>
          
          {supporters?.map((supporter) => (
            <Card key={supporter.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{supporter.supporter_name}</div>
                    <div className="text-sm text-muted-foreground">{supporter.relationship}</div>
                    <div className="text-xs text-muted-foreground">{supporter.supporter_email}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={supporter.can_send_messages ? 'default' : 'secondary'}>
                      {supporter.can_send_messages ? 'Can Message' : 'View Only'}
                    </Badge>
                    {supporter.is_muted && (
                      <Badge variant="outline">Muted</Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Access
                </Button>
              </CardContent>
            </Card>
          ))}
          {supporters?.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No supporters added yet</p>
                <p className="text-sm mt-1">Invite family and friends to support your journey</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
