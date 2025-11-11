import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Comment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

interface ResumeData {
  title: string;
  sections: any[];
  styling: any;
}

export default function PublicReviewerView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [canComment, setCanComment] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadResumeShare();
    }
  }, [token]);

  const loadResumeShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('resume-share-resolve', {
        body: { share_token: token },
      });

      if (invokeError) throw invokeError;

      if (data?.error) {
        setError(data.error.message);
        return;
      }

      setResume(data.resume);
      setComments(data.comments || []);
      setCanComment(data.can_comment);
    } catch (err) {
      console.error('Failed to load resume share:', err);
      setError('Failed to load resume. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim() || !commentBody.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('resume-share-comment', {
        body: {
          share_token: token,
          author_name: authorName.trim(),
          body: commentBody.trim(),
        },
      });

      if (invokeError) throw invokeError;

      if (data?.error) {
        throw new Error(data.error.message);
      }

      setComments([...comments, data.comment]);
      setCommentBody("");
      toast.success("Comment posted successfully");
    } catch (err) {
      console.error('Failed to post comment:', err);
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-4xl text-center">
        <p className="text-muted-foreground">Loading resume...</p>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-4xl">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Resume</h2>
          <p className="text-muted-foreground">{error || "Resume not found"}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="p-6 mb-6 bg-muted/50 border-primary/20">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          This resume has been shared with you for review. Please do not distribute this link.
        </p>
      </Card>

      {/* Resume Preview */}
      <Card className="p-8 mb-8">
        <h1 className="text-3xl font-bold mb-6">{resume.title}</h1>
        
        {resume.sections?.map((section: any, idx: number) => (
          <div key={idx} className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-primary">{section.title}</h2>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content || '' }}
            />
          </div>
        ))}
      </Card>

      {/* Comments Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Feedback & Comments</h2>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>

        {comments.length > 0 && (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {canComment ? (
          <>
            {comments.length > 0 && <Separator className="mb-6" />}
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div>
                <Label htmlFor="authorName">Your Name</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="commentBody">Your Feedback</Label>
                <Textarea
                  id="commentBody"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Share your feedback or suggestions..."
                  rows={4}
                  maxLength={2000}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Comments are not enabled for this resume share.
          </p>
        )}
      </Card>
    </div>
  );
}
