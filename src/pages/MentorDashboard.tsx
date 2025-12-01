import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MenteeCard } from "@/components/mentor/MenteeCard";
import { Users, AlertCircle } from "lucide-react";

export default function MentorDashboard() {
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const user = userData?.data?.user;

  const { data: teams = [] } = useQuery({
    queryKey: ["mentor-teams"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("team_memberships")
        .select("team_id, role, teams(id, name)")
        .eq("user_id", user.id)
        .in("role", ["mentor", "admin"]);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: mentees = [], isLoading } = useQuery({
    queryKey: ["mentees", teams],
    queryFn: async () => {
      if (!user || teams.length === 0) return [];

      const teamIds = teams.map((t) => t.team_id);

      // Get all candidates in mentor's teams
      const { data: memberships, error: memberError } = await supabase
        .from("team_memberships")
        .select("user_id, team_id")
        .in("team_id", teamIds)
        .eq("role", "candidate");

      if (memberError) throw memberError;

      const candidateIds = memberships.map((m) => m.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", candidateIds);

      // Get stats for each candidate
      const menteesWithStats = await Promise.all(
        memberships.map(async (membership) => {
          const [jobsResult, interviewsResult, goalsResult] = await Promise.all([
            supabase
              .from("jobs")
              .select("id, status")
              .eq("user_id", membership.user_id),
            supabase
              .from("interviews")
              .select("id")
              .eq("user_id", membership.user_id),
            supabase
              .from("goals")
              .select("id")
              .eq("user_id", membership.user_id)
              .eq("status", "active"),
          ]);

          const profile = profiles?.find((p) => p.user_id === membership.user_id);
          const jobs = jobsResult.data || [];
          const offers = jobs.filter((j) => ["offer", "accepted"].includes(j.status)).length;

          return {
            user_id: membership.user_id,
            team_id: membership.team_id,
            profile,
            stats: {
              applications: jobs.length,
              interviews: interviewsResult.data?.length || 0,
              offers,
              activeGoals: goalsResult.data?.length || 0,
            },
          };
        })
      );

      return menteesWithStats;
    },
    enabled: !!user && teams.length > 0,
  });

  const isMentorOrAdmin = teams.some((t) => ["mentor", "admin"].includes(t.role));

  if (!isMentorOrAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You need to be a mentor or admin in a team to access this dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mentor Dashboard</h1>
          <p className="text-muted-foreground">Monitor and support your mentees' progress</p>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">About This Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              As a mentor, you can view your mentees' key metrics, provide feedback on their applications,
              interviews, and goals, and track their progress over time.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading mentees...</div>
        ) : mentees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No mentees yet</h3>
              <p className="text-muted-foreground">
                Candidates will appear here once they join your team
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentees.map((mentee) => (
              <MenteeCard key={mentee.user_id} mentee={mentee} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
