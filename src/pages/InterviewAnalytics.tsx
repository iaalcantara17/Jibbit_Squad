import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp, Target, Calendar, Award, BarChart3, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";

interface Interview {
  id: string;
  interview_type: string;
  outcome: string;
  scheduled_start: string;
  created_at: string;
}

interface MockSession {
  id: string;
  format: string;
  status: string;
  started_at: string;
}

interface PracticeResponse {
  id: string;
  created_at: string;
  status: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

const InterviewAnalytics = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [mockSessions, setMockSessions] = useState<MockSession[]>([]);
  const [practiceResponses, setPracticeResponses] = useState<PracticeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [interviewsData, mockData, practiceData] = await Promise.all([
        supabase.from("interviews").select("*").eq("user_id", user.id),
        supabase.from("mock_interview_sessions").select("*").eq("user_id", user.id),
        supabase.from("question_practice_responses").select("*").eq("user_id", user.id),
      ]);

      if (interviewsData.data) setInterviews(interviewsData.data as any);
      if (mockData.data) setMockSessions(mockData.data as any);
      if (practiceData.data) setPracticeResponses(practiceData.data as any);
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter((i) => i.outcome && i.outcome !== "pending").length;
  const offersReceived = interviews.filter((i) => i.outcome === "offer").length;
  const conversionRate = completedInterviews > 0 ? (offersReceived / completedInterviews) * 100 : 0;

  const totalMockSessions = mockSessions.length;
  const completedMockSessions = mockSessions.filter((s) => s.status === "completed").length;
  const totalPracticeResponses = practiceResponses.length;

  // Format breakdown
  const formatBreakdown = interviews.reduce((acc, interview) => {
    const type = interview.interview_type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatData = Object.entries(formatBreakdown).map(([name, value]) => ({
    name: name.replace("_", " ").charAt(0).toUpperCase() + name.replace("_", " ").slice(1),
    value,
  }));

  // Outcome breakdown
  const outcomeBreakdown = interviews.reduce((acc, interview) => {
    if (interview.outcome && interview.outcome !== "pending") {
      acc[interview.outcome] = (acc[interview.outcome] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const outcomeData = Object.entries(outcomeBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Trends over last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, "MMM yyyy"),
      monthStart: startOfMonth(date).toISOString(),
    };
  });

  const trendsData = last6Months.map((month) => {
    const interviewsInMonth = interviews.filter(
      (i) => i.created_at >= month.monthStart && i.created_at < (last6Months[last6Months.indexOf(month) + 1]?.monthStart || new Date().toISOString())
    ).length;

    const practiceInMonth = practiceResponses.filter(
      (p) => p.created_at >= month.monthStart && p.created_at < (last6Months[last6Months.indexOf(month) + 1]?.monthStart || new Date().toISOString())
    ).length;

    return {
      month: month.month,
      interviews: interviewsInMonth,
      practice: practiceInMonth,
    };
  });

  // Practice vs outcome correlation
  const practiceCorrelationData = interviews
    .filter((i) => i.outcome && i.outcome !== "pending")
    .map((interview) => {
      // Count practice sessions before this interview
      const practiceCount = practiceResponses.filter(
        (p) => new Date(p.created_at) < new Date(interview.scheduled_start || interview.created_at)
      ).length;

      return {
        interview: interview.interview_type || "interview",
        practiceCount,
        outcome: interview.outcome,
        success: interview.outcome === "offer" ? 1 : 0,
      };
    });

  const avgPracticeByOutcome = {
    offer: practiceCorrelationData.filter((d) => d.outcome === "offer").reduce((sum, d) => sum + d.practiceCount, 0) / (practiceCorrelationData.filter((d) => d.outcome === "offer").length || 1),
    rejected: practiceCorrelationData.filter((d) => d.outcome === "rejected").reduce((sum, d) => sum + d.practiceCount, 0) / (practiceCorrelationData.filter((d) => d.outcome === "rejected").length || 1),
  };

  const practiceOutcomeData = [
    { outcome: "Offer", avgPractice: Math.round(avgPracticeByOutcome.offer) },
    { outcome: "Rejected", avgPractice: Math.round(avgPracticeByOutcome.rejected) },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Interview Analytics</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Track your interview performance and identify areas for improvement
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {offersReceived} offers from {completedInterviews} interviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalInterviews}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedInterviews} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Mock Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalMockSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedMockSessions} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Practice Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalPracticeResponses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Question practice sessions
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trends" className="w-full">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="correlation">Practice Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Activity Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="interviews" stroke="hsl(var(--primary))" name="Interviews" />
                      <Line type="monotone" dataKey="practice" stroke="hsl(var(--secondary))" name="Practice Sessions" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Format Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formatData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={formatData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            dataKey="value"
                          >
                            {formatData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No interview data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interview Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {outcomeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={outcomeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            dataKey="value"
                          >
                            {outcomeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No outcome data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="correlation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Practice Sessions vs Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Average practice sessions completed before interviews by outcome
                  </p>
                  {practiceOutcomeData.some((d) => d.avgPractice > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={practiceOutcomeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="outcome" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgPractice" fill="hsl(var(--primary))" name="Avg Practice Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Complete some interviews with outcomes to see correlations
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Practice Impact</p>
                    <p className="text-sm text-muted-foreground">
                      {avgPracticeByOutcome.offer > avgPracticeByOutcome.rejected
                        ? `Successful candidates practiced ${Math.round(((avgPracticeByOutcome.offer - avgPracticeByOutcome.rejected) / avgPracticeByOutcome.rejected) * 100)}% more on average`
                        : "More data needed to identify practice patterns"}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Conversion Performance</p>
                    <p className="text-sm text-muted-foreground">
                      {conversionRate > 25
                        ? "Your conversion rate is above average! Keep up the great work."
                        : conversionRate > 15
                        ? "Your conversion rate is on track. Focus on preparation to improve further."
                        : "Consider increasing practice sessions and mock interviews to boost your success rate."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InterviewAnalytics;
