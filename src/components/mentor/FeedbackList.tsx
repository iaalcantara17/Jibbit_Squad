import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, MessageSquare } from "lucide-react";

interface FeedbackListProps {
  entityType: "job" | "interview" | "goal";
  entityId: string;
  candidateId: string;
  isCandidate?: boolean;
}

export const FeedbackList = ({ entityType, entityId, candidateId, isCandidate = false }: FeedbackListProps) => {
  const queryClient = useQueryClient();

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["mentor-feedback", entityType, entityId],
    queryFn: async () => {
      const { data: feedbackData, error } = await supabase
        .from("mentor_feedback")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch mentor profiles
      const mentorIds = feedbackData.map(f => f.mentor_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", mentorIds);

      // Combine data
      return feedbackData.map(feedback => ({
        ...feedback,
        profile: profiles?.find(p => p.user_id === feedback.mentor_id),
      }));
    },
  });

  const implementMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from("mentor_feedback")
        .update({
          implemented: true,
          implemented_at: new Date().toISOString(),
        })
        .eq("id", feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-feedback"] });
      toast.success("Marked as implemented");
    },
  });

  if (isLoading) return null;
  if (feedbacks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mentor Feedback ({feedbacks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">
                  From: {feedback.profile?.name || feedback.profile?.email || "Mentor"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </p>
              </div>
              {feedback.implemented ? (
                <Badge variant="outline" className="text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Implemented
                </Badge>
              ) : isCandidate ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => implementMutation.mutate(feedback.id)}
                  disabled={implementMutation.isPending}
                >
                  Mark Implemented
                </Button>
              ) : null}
            </div>
            <p className="text-sm">{feedback.feedback_text}</p>
            {feedback.implemented_at && (
              <p className="text-xs text-muted-foreground">
                Implemented on {new Date(feedback.implemented_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
