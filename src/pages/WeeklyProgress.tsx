import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { TrendingUp, Briefcase, Calendar, Target, MessageSquare, CheckCircle } from "lucide-react";

export default function WeeklyProgress() {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const user = userData?.data?.user;

  const { data: weeklyJobs = [] } = useQuery({
    queryKey: ["weekly-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: weeklyInterviews = [] } = useQuery({
    queryKey: ["weekly-interviews", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("interviews")
        .select("*, jobs(company_name, job_title)")
        .eq("user_id", user.id)
        .gte("interview_date", weekStart.toISOString())
        .lte("interview_date", weekEnd.toISOString())
        .order("interview_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: weeklyGoalUpdates = [] } = useQuery({
    queryKey: ["weekly-goal-updates", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .gte("updated_at", weekStart.toISOString())
        .lte("updated_at", weekEnd.toISOString())
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: weeklyFeedback = [] } = useQuery({
    queryKey: ["weekly-feedback", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: feedbackData, error } = await supabase
        .from("mentor_feedback")
        .select("*")
        .eq("candidate_id", user.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString())
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
    enabled: !!user,
  });

  const implementedCount = weeklyFeedback.filter((f) => f.implemented).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Weekly Progress Report</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </p>
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
              <div className="text-2xl font-bold">{weeklyJobs.length}</div>
              <p className="text-xs text-muted-foreground">This week</p>
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
              <div className="text-2xl font-bold">{weeklyInterviews.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled or completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Goals Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyGoalUpdates.length}</div>
              <p className="text-xs text-muted-foreground">Progress tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mentor Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyFeedback.length}</div>
              <p className="text-xs text-muted-foreground">{implementedCount} implemented</p>
            </CardContent>
          </Card>
        </div>

        {weeklyJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Applications This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{job.job_title}</p>
                    <p className="text-sm text-muted-foreground">{job.company_name}</p>
                  </div>
                  <Badge>{job.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {weeklyInterviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Interviews This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {interview.jobs?.job_title} at {interview.jobs?.company_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(interview.interview_date), "MMM d, yyyy")}
                      {interview.interview_type && ` • ${interview.interview_type}`}
                    </p>
                  </div>
                  <Badge>{interview.status || "scheduled"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {weeklyFeedback.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mentor Feedback Received
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyFeedback.map((feedback) => (
                <div key={feedback.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm">
                      From: {feedback.profile?.name || feedback.profile?.email || "Mentor"}
                    </p>
                    {feedback.implemented && (
                      <Badge variant="outline" className="text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Implemented
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{feedback.feedback_text}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {feedback.entity_type} feedback
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {weeklyJobs.length === 0 &&
          weeklyInterviews.length === 0 &&
          weeklyGoalUpdates.length === 0 &&
          weeklyFeedback.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No activity this week</h3>
                <p className="text-muted-foreground">
                  Start applying to jobs or working on your goals to see your weekly progress
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
