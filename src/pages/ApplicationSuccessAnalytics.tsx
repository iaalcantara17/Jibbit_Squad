import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Briefcase, Building2, Target, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApplicationSuccessAnalytics() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    byIndustry: [] as any[],
    byJobType: [] as any[],
    customizationImpact: {
      withResume: { total: 0, success: 0, rate: 0 },
      withoutResume: { total: 0, success: 0, rate: 0 },
      withCoverLetter: { total: 0, success: 0, rate: 0 },
      withoutCoverLetter: { total: 0, success: 0, rate: 0 },
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false);

      if (error) throw error;

      setJobs(jobsData || []);
      calculateAnalytics(jobsData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (jobsData: any[]) => {
    // Success = Interview, Offer statuses
    const isSuccess = (status: string) =>
      ["interview", "phone_screen", "offer"].includes(status.toLowerCase());

    // By Industry
    const industryMap = new Map<string, { total: number; success: number }>();
    jobsData.forEach((job) => {
      const industry = job.industry || "Not specified";
      if (!industryMap.has(industry)) {
        industryMap.set(industry, { total: 0, success: 0 });
      }
      const stats = industryMap.get(industry)!;
      stats.total++;
      if (isSuccess(job.status)) stats.success++;
    });

    const byIndustry = Array.from(industryMap.entries())
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        success: stats.success,
        rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // By Job Type
    const jobTypeMap = new Map<string, { total: number; success: number }>();
    jobsData.forEach((job) => {
      const type = job.job_type || "Not specified";
      if (!jobTypeMap.has(type)) {
        jobTypeMap.set(type, { total: 0, success: 0 });
      }
      const stats = jobTypeMap.get(type)!;
      stats.total++;
      if (isSuccess(job.status)) stats.success++;
    });

    const byJobType = Array.from(jobTypeMap.entries())
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        success: stats.success,
        rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Customization Impact
    const withResume = jobsData.filter((j) => j.resume_id);
    const withoutResume = jobsData.filter((j) => !j.resume_id);
    const withCoverLetter = jobsData.filter((j) => j.cover_letter_id);
    const withoutCoverLetter = jobsData.filter((j) => !j.cover_letter_id);

    const customizationImpact = {
      withResume: {
        total: withResume.length,
        success: withResume.filter((j) => isSuccess(j.status)).length,
        rate: withResume.length > 0
          ? Math.round((withResume.filter((j) => isSuccess(j.status)).length / withResume.length) * 100)
          : 0,
      },
      withoutResume: {
        total: withoutResume.length,
        success: withoutResume.filter((j) => isSuccess(j.status)).length,
        rate: withoutResume.length > 0
          ? Math.round((withoutResume.filter((j) => isSuccess(j.status)).length / withoutResume.length) * 100)
          : 0,
      },
      withCoverLetter: {
        total: withCoverLetter.length,
        success: withCoverLetter.filter((j) => isSuccess(j.status)).length,
        rate: withCoverLetter.length > 0
          ? Math.round((withCoverLetter.filter((j) => isSuccess(j.status)).length / withCoverLetter.length) * 100)
          : 0,
      },
      withoutCoverLetter: {
        total: withoutCoverLetter.length,
        success: withoutCoverLetter.filter((j) => isSuccess(j.status)).length,
        rate: withoutCoverLetter.length > 0
          ? Math.round((withoutCoverLetter.filter((j) => isSuccess(j.status)).length / withoutCoverLetter.length) * 100)
          : 0,
      },
    };

    setAnalytics({ byIndustry, byJobType, customizationImpact });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Application Success Rate Analysis</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this means:</strong> Success is defined as advancing to Phone Screen, Interview, or Offer stages.
            Higher success rates indicate better targeting and application quality for specific industries or job types.
          </AlertDescription>
        </Alert>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Application Data Yet</p>
              <p className="text-muted-foreground text-center">
                Start tracking job applications to see success rate breakdowns by industry, job type, and customization impact.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="industry" className="space-y-6">
            <TabsList>
              <TabsTrigger value="industry">By Industry</TabsTrigger>
              <TabsTrigger value="jobtype">By Job Type</TabsTrigger>
              <TabsTrigger value="customization">Customization Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="industry" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Success Rate by Industry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.byIndustry.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No industry data available. Add industry information to your job applications.
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.byIndustry}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" fill="#3b82f6" name="Total Applications" />
                          <Bar dataKey="success" fill="#10b981" name="Successful" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.byIndustry.map((item, index) => (
                          <Card key={item.name}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{item.name}</span>
                                <Badge variant={item.rate >= 30 ? "default" : "secondary"}>
                                  {item.rate}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.success} of {item.total} successful
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobtype" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Success Rate by Job Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.byJobType.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No job type data available. Add job type information to your applications.
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.byJobType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, rate }) => `${name}: ${rate}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="total"
                          >
                            {analytics.byJobType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-6 space-y-3">
                        {analytics.byJobType.map((item) => (
                          <div key={item.name} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <p className="text-sm text-muted-foreground">
                                {item.success} of {item.total} successful
                              </p>
                            </div>
                            <Badge variant={item.rate >= 30 ? "default" : "secondary"}>
                              {item.rate}% success
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Impact of Customization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Applications with customized resumes and cover letters typically show higher success rates.
                      This data shows the correlation in your applications.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Resume Attached</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">With Resume</span>
                            <Badge variant="default">{analytics.customizationImpact.withResume.rate}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {analytics.customizationImpact.withResume.success} of{" "}
                            {analytics.customizationImpact.withResume.total} successful
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Without Resume</span>
                            <Badge variant="secondary">{analytics.customizationImpact.withoutResume.rate}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {analytics.customizationImpact.withoutResume.success} of{" "}
                            {analytics.customizationImpact.withoutResume.total} successful
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cover Letter Attached</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">With Cover Letter</span>
                            <Badge variant="default">{analytics.customizationImpact.withCoverLetter.rate}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {analytics.customizationImpact.withCoverLetter.success} of{" "}
                            {analytics.customizationImpact.withCoverLetter.total} successful
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Without Cover Letter</span>
                            <Badge variant="secondary">{analytics.customizationImpact.withoutCoverLetter.rate}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {analytics.customizationImpact.withoutCoverLetter.success} of{" "}
                            {analytics.customizationImpact.withoutCoverLetter.total} successful
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
