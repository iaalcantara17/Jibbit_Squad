import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { addDays } from "date-fns";

interface InviteMemberDialogProps {
  teamId: string;
}

export const InviteMemberDialog = ({ teamId }: InviteMemberDialogProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "candidate" as "admin" | "mentor" | "candidate",
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate random token
      const token = crypto.randomUUID();
      const expiresAt = addDays(new Date(), 7); // 7 days expiry

      const { error } = await supabase
        .from("team_invitations")
        .insert([{
          team_id: teamId,
          email: formData.email,
          role: formData.role,
          token,
          expires_at: expiresAt.toISOString(),
          invited_by: user.id,
        }]);

      if (error) throw error;

      // In a real app, you'd send an email with the invitation link
      // For now, we'll just show the link in a toast
      const inviteLink = `${window.location.origin}/accept-invitation/${token}`;
      navigator.clipboard.writeText(inviteLink);
      
      return inviteLink;
    },
    onSuccess: (inviteLink) => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations", teamId] });
      toast.success("Invitation created! Link copied to clipboard.");
      setIsOpen(false);
      setFormData({ email: "", role: "candidate" });
    },
    onError: (error) => {
      toast.error("Failed to create invitation: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "mentor" | "candidate") => 
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            <p><strong>Admin:</strong> Manage team, invite members, view all data</p>
            <p><strong>Mentor:</strong> View all candidates in team</p>
            <p><strong>Candidate:</strong> View only own data</p>
          </div>
          <Button type="submit" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? "Creating..." : "Create Invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
