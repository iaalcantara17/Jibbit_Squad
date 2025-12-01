import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddFeedbackDialog } from "@/components/mentor/AddFeedbackDialog";
import { FeedbackList } from "@/components/mentor/FeedbackList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Calendar, Target, TrendingUp } from "lucide-react";

export default function MenteeDetail() {
  const { menteeId } = useParams<{ menteeId: string }>();

  const { data: currentUserData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const currentUser = currentUserData?.data?.user;

  const { data: mentee } = useQuery({
    queryKey: ["mentee-profile", menteeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", menteeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!menteeId,
  });

  const { data: teamMembership } = useQuery({
    queryKey: ["mentee-team", menteeId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || !menteeId) return null;

      // Find common team where current user is mentor/admin
      const { data, error } = await supabase
        .from("team_memberships")
        .select("team_id, teams(name)")
        .eq("user_id", menteeId);

      if (error) throw error;

      // Check if current user is mentor/admin in any of these teams
      const teamIds = data.map((m) => m.team_id);
      const { data: mentorTeams } = await supabase
        .from("team_memberships")
        .select("team_id, role")
        .eq("user_id", currentUser.id)
        .in("team_id", teamIds)
        .in("role", ["mentor", "admin"]);

      if (mentorTeams && mentorTeams.length > 0) {
        const firstTeam = data.find((m) => m.team_id === mentorTeams[0].team_id);
        return {
          team_id: mentorTeams[0].team_id,
          team_name: firstTeam?.teams?.name,
        };
      }

      return null;
    },
    enabled: !!menteeId && !!currentUser,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["mentee-jobs", menteeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", menteeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!menteeId,
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["mentee-interviews", menteeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, jobs(company_name, job_title)")
        .eq("user_id", menteeId)
        .order("interview_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!menteeId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["mentee-goals", menteeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", menteeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!menteeId,
  });

  if (!mentee || !teamMembership) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-muted-foreground">Loading mentee data...</p>
        </div>
      </div>
    );
  }

  const stats = {
    applications: jobs.length,
    interviews: interviews.length,
    offers: jobs.filter((j) => ["offer", "accepted"].includes(j.status)).length,
    activeGoals: goals.filter((g) => g.status === "active").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{mentee.name || mentee.email}</h1>
          <p className="text-muted-foreground">Team: {teamMembership.team_name}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.applications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGoals}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList>
            <TabsTrigger value="jobs">Job Applications</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.job_title}</CardTitle>
                      <CardDescription>{job.company_name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{job.status}</Badge>
                      {teamMembership && menteeId && (
                        <AddFeedbackDialog
                          teamId={teamMembership.team_id}
                          candidateId={menteeId}
                          entityType="job"
                          entityId={job.id}
                          entityName={`${job.job_title} at ${job.company_name}`}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.notes && <p className="text-sm text-muted-foreground mb-4">{job.notes}</p>}
                  {menteeId && (
                    <FeedbackList
                      entityType="job"
                      entityId={job.id}
                      candidateId={menteeId}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            {jobs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No applications yet</p>
            )}
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {interview.jobs?.job_title} at {interview.jobs?.company_name}
                      </CardTitle>
                      <CardDescription>
                        {interview.interview_date
                          ? new Date(interview.interview_date).toLocaleDateString()
                          : "Date TBD"}
                        {interview.interview_type && ` • ${interview.interview_type}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{interview.status || "scheduled"}</Badge>
                      {teamMembership && menteeId && (
                        <AddFeedbackDialog
                          teamId={teamMembership.team_id}
                          candidateId={menteeId}
                          entityType="interview"
                          entityId={interview.id}
                          entityName={`Interview at ${interview.jobs?.company_name}`}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {interview.notes && <p className="text-sm text-muted-foreground mb-4">{interview.notes}</p>}
                  {menteeId && (
                    <FeedbackList
                      entityType="interview"
                      entityId={interview.id}
                      candidateId={menteeId}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            {interviews.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No interviews yet</p>
            )}
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription>{goal.category}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{goal.status}</Badge>
                      {teamMembership && menteeId && (
                        <AddFeedbackDialog
                          teamId={teamMembership.team_id}
                          candidateId={menteeId}
                          entityType="goal"
                          entityId={goal.id}
                          entityName={goal.title}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal.description && <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>}
                  {goal.target_value && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{goal.current_value || 0} / {goal.target_value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {menteeId && (
                    <FeedbackList
                      entityType="goal"
                      entityId={goal.id}
                      candidateId={menteeId}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            {goals.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No goals yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
