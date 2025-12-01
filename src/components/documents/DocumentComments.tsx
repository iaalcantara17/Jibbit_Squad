import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageSquare, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentCommentsProps {
  documentType: 'resume' | 'cover_letter';
  documentId: string;
  canComment: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  quoted_text: string | null;
  resolved: boolean;
  created_at: string;
}

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
}

export const DocumentComments = ({
  documentType,
  documentId,
  canComment,
}: DocumentCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [quotedText, setQuotedText] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['document-comments', documentType, documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Comment[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-comments', comments.map(c => c.user_id)],
    queryFn: async () => {
      if (comments.length === 0) return [];
      const uniqueUserIds = [...new Set(comments.map(c => c.user_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', uniqueUserIds);
      if (error) throw error;
      return data as Profile[];
    },
    enabled: comments.length > 0,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_type: documentType,
          document_id: documentId,
          user_id: user.id,
          comment_text: newComment,
          quoted_text: quotedText || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Comment added');
      setNewComment('');
      setQuotedText('');
      queryClient.invalidateQueries({ queryKey: ['document-comments'] });
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const toggleResolvedMutation = useMutation({
    mutationFn: async ({ commentId, resolved }: { commentId: string; resolved: boolean }) => {
      const { error } = await supabase
        .from('document_comments')
        .update({ resolved })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments'] });
    },
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      setQuotedText(text);
      toast.success('Text selected for comment');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Comments ({comments.length})</h3>
      </div>

      {canComment && (
        <div className="space-y-3 mb-6 pb-6 border-b">
          <p className="text-sm text-muted-foreground">
            Select text in the document to quote it in your comment
          </p>
          
          {quotedText && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Selected text:</p>
              <p className="text-sm italic">"{quotedText}"</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuotedText('')}
                className="mt-2"
              >
                Clear selection
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={() => addCommentMutation.mutate()}
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet
          </p>
        ) : (
          comments.map((comment) => {
            const profile = profiles.find(p => p.user_id === comment.user_id);
            return (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  comment.resolved ? 'bg-muted/50' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">
                      {profile?.name || profile?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {comment.resolved && (
                      <Badge variant="secondary">Resolved</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleResolvedMutation.mutate({
                          commentId: comment.id,
                          resolved: !comment.resolved,
                        })
                      }
                    >
                      {comment.resolved ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {comment.quoted_text && (
                  <div className="p-2 bg-muted rounded mb-2">
                    <p className="text-xs text-muted-foreground mb-1">Quote:</p>
                    <p className="text-sm italic">"{comment.quoted_text}"</p>
                  </div>
                )}

                <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
