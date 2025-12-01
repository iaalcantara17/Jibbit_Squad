import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Calendar, Briefcase, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SuccessPatterns() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interviews").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: statusHistory = [] } = useQuery({
    queryKey: ["status-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("application_status_history").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Pattern 1: Success by industry
  const successfulJobs = jobs.filter((j) => ["offer", "accepted"].includes(j.status));
  const industrySuccess = successfulJobs.reduce((acc, job) => {
    if (job.industry) {
      acc[job.industry] = (acc[job.industry] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const industryData = Object.entries(industrySuccess)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Pattern 2: Time to response
  const timeToResponse = jobs
    .filter((j) => j.status !== "wishlist" && j.status !== "applied")
    .map((job) => {
      const history = statusHistory.filter((h) => h.job_id === job.id);
      if (history.length > 0) {
        const applied = history.find((h) => h.to_status === "applied");
        const responded = history.find((h) =>
          ["phone_screen", "interviewing", "offer"].includes(h.to_status)
        );
        if (applied && responded) {
          const days = Math.floor(
            (new Date(responded.changed_at).getTime() - new Date(applied.changed_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return { job: job.job_title, days, success: ["offer", "accepted"].includes(job.status) };
        }
      }
      return null;
    })
    .filter(Boolean);

  const avgTimeToResponse =
    timeToResponse.length > 0
      ? timeToResponse.reduce((sum, t) => sum + (t?.days || 0), 0) / timeToResponse.length
      : 0;

  const successfulTimeToResponse = timeToResponse
    .filter((t) => t?.success)
    .reduce((sum, t) => sum + (t?.days || 0), 0) / (timeToResponse.filter((t) => t?.success).length || 1);

  // Pattern 3: Application source success
  const sourcePattern = jobs
    .filter((j) => j.job_url)
    .reduce((acc, job) => {
      let source = "Direct";
      if (job.job_url?.includes("linkedin")) source = "LinkedIn";
      else if (job.job_url?.includes("indeed")) source = "Indeed";
      else if (job.job_url?.includes("glassdoor")) source = "Glassdoor";

      if (!acc[source]) acc[source] = { total: 0, successful: 0 };
      acc[source].total++;
      if (["offer", "accepted"].includes(job.status)) {
        acc[source].successful++;
      }
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

  const sourceData = Object.entries(sourcePattern)
    .map(([name, { total, successful }]) => ({
      name,
      rate: total > 0 ? (successful / total) * 100 : 0,
      count: successful,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Pattern 4: Day of week application success
  const dayOfWeekPattern = jobs.reduce((acc, job) => {
    const day = new Date(job.created_at).getDay();
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
    if (!acc[dayName]) acc[dayName] = { total: 0, successful: 0 };
    acc[dayName].total++;
    if (["offer", "accepted"].includes(job.status)) {
      acc[dayName].successful++;
    }
    return acc;
  }, {} as Record<string, { total: number; successful: number }>);

  const dayData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    .map((name) => ({
      name,
      rate: dayOfWeekPattern[name]
        ? (dayOfWeekPattern[name].successful / dayOfWeekPattern[name].total) * 100
        : 0,
    }))
    .filter((d) => d.rate > 0);

  const totalApplications = jobs.filter((j) => j.status !== "wishlist").length;
  const sampleSize = Math.min(totalApplications, successfulJobs.length);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Success Patterns</h1>
        <p className="text-muted-foreground">Insights from your application history</p>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Methodology</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            All patterns below are derived from your {totalApplications} applications (
            {successfulJobs.length} successful offers). No external or peer data is used.
          </p>
          <p>
            <strong>Note:</strong> Small sample sizes can produce unreliable patterns. Look for trends with at least
            5-10 data points. As you add more applications, these insights will become more meaningful.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Analyzing your data...</div>
      ) : totalApplications === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground">
              Start applying to jobs to see patterns in your application history
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Success by Industry
                </CardTitle>
                <CardDescription>Industries where you got offers (N={successfulJobs.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {industryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={industryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Not enough data yet. Add industry info to your successful applications.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time Pattern
                </CardTitle>
                <CardDescription>Time from application to response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Avg. time to any response</span>
                    <Badge variant="outline">{avgTimeToResponse.toFixed(1)} days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. time for successful apps</span>
                    <Badge>{successfulTimeToResponse.toFixed(1)} days</Badge>
                  </div>
                </div>
                {avgTimeToResponse > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">
                      {successfulTimeToResponse < avgTimeToResponse ? (
                        <>
                          <TrendingUp className="inline h-4 w-4 text-green-500 mr-1" />
                          Your successful applications tend to get responses{" "}
                          {((avgTimeToResponse - successfulTimeToResponse) / avgTimeToResponse * 100).toFixed(0)}%
                          faster than average.
                        </>
                      ) : (
                        <>Pattern unclear with current data. Continue tracking to see trends.</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Application Source Success
                </CardTitle>
                <CardDescription>Success rate by where you found the job</CardDescription>
              </CardHeader>
              <CardContent>
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Bar dataKey="rate" fill="hsl(var(--secondary))" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">Add job URLs to track source performance</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Day of Week Pattern
                </CardTitle>
                <CardDescription>Success rate by day you applied</CardDescription>
              </CardHeader>
              <CardContent>
                {dayData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Bar dataKey="rate" fill="hsl(var(--accent))" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">More data needed to identify day patterns</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {industryData.length > 0 && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Industry Focus</p>
                    <p className="text-sm text-muted-foreground">
                      You've had the most success in {industryData[0].name} ({industryData[0].value} offers).
                    </p>
                  </div>
                </div>
              )}
              {sourceData.length > 0 && sourceData[0].rate > 0 && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Best Source</p>
                    <p className="text-sm text-muted-foreground">
                      {sourceData[0].name} has your highest success rate at {sourceData[0].rate.toFixed(1)}%.
                    </p>
                  </div>
                </div>
              )}
              {sampleSize < 10 && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Small Sample Size</p>
                    <p className="text-sm text-muted-foreground">
                      With only {sampleSize} successful applications, patterns may not be statistically significant yet.
                      Keep applying to see clearer trends.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
