import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Users } from "lucide-react";
import { TeamRole } from "@/hooks/useTeamRole";

interface TeamMembersListProps {
  teamId: string;
  userRole: TeamRole | null;
}

export const TeamMembersList = ({ teamId, userRole }: TeamMembersListProps) => {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("team_memberships")
        .select("*")
        .eq("team_id", teamId);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = memberships.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, name, email")
        .in("user_id", userIds);

      // Combine the data
      return memberships.map(membership => ({
        ...membership,
        profile: profiles?.find(p => p.user_id === membership.user_id),
      }));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("team_memberships")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Member removed");
    },
    onError: (error) => {
      toast.error("Failed to remove member: " + error.message);
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "mentor":
        return "bg-blue-500";
      case "candidate":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading members...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <div className="font-medium">{member.profile?.name || member.profile?.email || "Unknown User"}</div>
              <div className="text-sm text-muted-foreground">{member.profile?.email || "No email"}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRoleBadgeColor(member.role)}>
                {member.role}
              </Badge>
              {userRole === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMutation.mutate(member.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No members yet</p>
        )}
      </CardContent>
    </Card>
  );
};
