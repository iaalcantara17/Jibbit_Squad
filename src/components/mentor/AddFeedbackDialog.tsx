import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";

interface AddFeedbackDialogProps {
  teamId: string;
  candidateId: string;
  entityType: "job" | "interview" | "goal";
  entityId: string;
  entityName: string;
}

export const AddFeedbackDialog = ({
  teamId,
  candidateId,
  entityType,
  entityId,
  entityName,
}: AddFeedbackDialogProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("mentor_feedback").insert([{
        team_id: teamId,
        mentor_id: user.id,
        candidate_id: candidateId,
        entity_type: entityType,
        entity_id: entityId,
        feedback_text: feedback,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-feedback"] });
      toast.success("Feedback added");
      setIsOpen(false);
      setFeedback("");
    },
    onError: (error) => {
      toast.error("Failed to add feedback: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Add Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Mentor Feedback</DialogTitle>
          <DialogDescription>
            For: {entityName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="feedback">Your Recommendation *</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              required
              placeholder="Share your insights and recommendations..."
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding..." : "Add Feedback"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
