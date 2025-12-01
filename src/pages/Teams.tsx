import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { InviteMemberDialog } from "@/components/teams/InviteMemberDialog";
import { TeamMembersList } from "@/components/teams/TeamMembersList";
import { useTeamRole } from "@/hooks/useTeamRole";
import { Users, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Teams() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: userRole } = useTeamRole(selectedTeamId || undefined);

  const { data: invitations = [] } = useQuery({
    queryKey: ["team-invitations", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", selectedTeamId)
        .eq("accepted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId && userRole === "admin",
  });

  // Auto-select first team
  if (teams.length > 0 && !selectedTeamId) {
    setSelectedTeamId(teams[0].id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teams</h1>
            <p className="text-muted-foreground">Collaborate with mentors and candidates</p>
          </div>
          <CreateTeamDialog />
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">About Teams</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">
              Teams enable collaboration between admins, mentors, and candidates with role-based permissions:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Admin:</strong> Manage team settings, invite members, view all member data</li>
              <li><strong>Mentor:</strong> View all candidates in the team</li>
              <li><strong>Candidate:</strong> View only their own data</li>
            </ul>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground">
                Create your first team to start collaborating
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Teams</h2>
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTeamId === team.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    {team.description && (
                      <CardDescription className="text-sm">{team.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="md:col-span-2 space-y-6">
              {selectedTeamId ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {teams.find((t) => t.id === selectedTeamId)?.name}
                    </h2>
                    {userRole === "admin" && (
                      <InviteMemberDialog teamId={selectedTeamId} />
                    )}
                  </div>

                  {userRole && (
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-sm text-muted-foreground">
                          Your role: <span className="font-semibold text-foreground">{userRole}</span>
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <TeamMembersList teamId={selectedTeamId} userRole={userRole} />

                  {userRole === "admin" && invitations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Pending Invitations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div>
                              <div className="font-medium">{invitation.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Role: {invitation.role} • Expires:{" "}
                                {new Date(invitation.expires_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a team to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
