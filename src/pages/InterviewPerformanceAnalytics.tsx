import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, Award, AlertCircle, Video, Phone, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InterviewPerformanceAnalytics() {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [mockSessions, setMockSessions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    interviewToOffer: 0,
    byFormat: [] as any[],
    trendData: [] as any[],
    practiceImpact: {
      withPractice: { total: 0, success: 0, rate: 0 },
      withoutPractice: { total: 0, success: 0, rate: 0 },
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [
        { data: interviewsData, error: interviewsError },
        { data: mockData, error: mockError },
      ] = await Promise.all([
        supabase.from("interviews").select("*").eq("user_id", user.id),
        supabase.from("mock_interview_sessions").select("*").eq("user_id", user.id),
      ]);

      if (interviewsError) throw interviewsError;
      if (mockError) throw mockError;

      setInterviews(interviewsData || []);
      setMockSessions(mockData || []);
      calculateAnalytics(interviewsData || [], mockData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (interviewsData: any[], mockData: any[]) => {
    // Interview to Offer Rate
    const completedInterviews = interviewsData.filter((i) => i.outcome);
    const offers = completedInterviews.filter((i) => i.outcome === "offer");
    const interviewToOffer = completedInterviews.length > 0
      ? Math.round((offers.length / completedInterviews.length) * 100)
      : 0;

    // By Format
    const formatMap = new Map<string, { total: number; success: number }>();
    interviewsData.forEach((interview) => {
      const format = interview.interview_type || "Not specified";
      if (!formatMap.has(format)) {
        formatMap.set(format, { total: 0, success: 0 });
      }
      const stats = formatMap.get(format)!;
      stats.total++;
      if (interview.outcome === "offer" || interview.outcome === "advanced") {
        stats.success++;
      }
    });

    const byFormat = Array.from(formatMap.entries())
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        success: stats.success,
        rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Trend Data (by month)
    const trendMap = new Map<string, { interviews: number; offers: number }>();
    interviewsData.forEach((interview) => {
      if (!interview.interview_date && !interview.scheduled_start) return;
      const date = new Date(interview.interview_date || interview.scheduled_start);
      const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      if (!trendMap.has(key)) {
        trendMap.set(key, { interviews: 0, offers: 0 });
      }
      const stats = trendMap.get(key)!;
      stats.interviews++;
      if (interview.outcome === "offer") stats.offers++;
    });

    const trendData = Array.from(trendMap.entries())
      .map(([month, stats]) => ({
        month,
        interviews: stats.interviews,
        offers: stats.offers,
        rate: stats.interviews > 0 ? Math.round((stats.offers / stats.interviews) * 100) : 0,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    // Practice Impact
    const jobsWithMock = new Set(mockData.map((m) => m.job_id).filter(Boolean));
    const withPractice = interviewsData.filter((i) => i.job_id && jobsWithMock.has(i.job_id));
    const withoutPractice = interviewsData.filter((i) => !i.job_id || !jobsWithMock.has(i.job_id));

    const practiceImpact = {
      withPractice: {
        total: withPractice.length,
        success: withPractice.filter((i) => i.outcome === "offer" || i.outcome === "advanced").length,
        rate: withPractice.length > 0
          ? Math.round((withPractice.filter((i) => i.outcome === "offer" || i.outcome === "advanced").length / withPractice.length) * 100)
          : 0,
      },
      withoutPractice: {
        total: withoutPractice.length,
        success: withoutPractice.filter((i) => i.outcome === "offer" || i.outcome === "advanced").length,
        rate: withoutPractice.length > 0
          ? Math.round((withoutPractice.filter((i) => i.outcome === "offer" || i.outcome === "advanced").length / withoutPractice.length) * 100)
          : 0,
      },
    };

    setAnalytics({ interviewToOffer, byFormat, trendData, practiceImpact });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Interview Performance Tracking</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this means:</strong> Track your interview success across formats and over time.
            Mock interview practice correlates with better real interview performance.
          </AlertDescription>
        </Alert>

        {interviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Interview Data Yet</p>
              <p className="text-muted-foreground text-center">
                Track interviews to see performance trends, format comparisons, and coaching recommendations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Key Metric */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Interview-to-Offer Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{analytics.interviewToOffer}%</div>
                <p className="text-muted-foreground mt-2">
                  {interviews.filter((i) => i.outcome === "offer").length} offers from{" "}
                  {interviews.filter((i) => i.outcome).length} completed interviews
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="format" className="space-y-6">
              <TabsList>
                <TabsTrigger value="format">By Format</TabsTrigger>
                <TabsTrigger value="trends">Trends Over Time</TabsTrigger>
                <TabsTrigger value="practice">Practice Impact</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Interview Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.byFormat.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No format data available. Add interview type to your interviews.
                      </p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analytics.byFormat}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total" fill="#3b82f6" name="Total" />
                            <Bar dataKey="success" fill="#10b981" name="Successful" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-6 space-y-3">
                          {analytics.byFormat.map((item) => {
                            const Icon = item.name.toLowerCase().includes("video")
                              ? Video
                              : item.name.toLowerCase().includes("phone")
                              ? Phone
                              : User;
                            return (
                              <div key={item.name} className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <span className="font-medium">{item.name}</span>
                                    <p className="text-sm text-muted-foreground">
                                      {item.success} of {item.total} successful
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={item.rate >= 50 ? "default" : "secondary"}>
                                  {item.rate}% success
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Interview Success Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.trendData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Not enough data to show trends. Complete more interviews over time.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="interviews" stroke="#3b82f6" name="Interviews" />
                          <Line type="monotone" dataKey="offers" stroke="#10b981" name="Offers" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="practice" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Impact of Mock Interview Practice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Coaching Tip:</strong> Candidates who practice with mock interviews before real ones
                        typically see improved performance. Consider practicing for upcoming interviews.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">With Mock Practice</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold mb-2">
                            {analytics.practiceImpact.withPractice.rate}%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {analytics.practiceImpact.withPractice.success} of{" "}
                            {analytics.practiceImpact.withPractice.total} successful
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Without Practice</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold mb-2">
                            {analytics.practiceImpact.withoutPractice.rate}%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {analytics.practiceImpact.withoutPractice.success} of{" "}
                            {analytics.practiceImpact.withoutPractice.total} successful
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {mockSessions.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-3">Your Mock Interview Sessions</h3>
                        <div className="space-y-2">
                          {mockSessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="text-sm font-medium">{session.target_role}</span>
                                {session.company_name && (
                                  <span className="text-sm text-muted-foreground"> at {session.company_name}</span>
                                )}
                              </div>
                              <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                                {session.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
