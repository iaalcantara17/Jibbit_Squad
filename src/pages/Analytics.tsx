import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, Target, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useExport } from "@/hooks/useExport";
import { Navigation } from "@/components/Navigation";
import { exportAnalyticsToCSV } from "@/lib/csvExportService";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateAverageTimeInStage,
  calculateDeadlineAdherence,
  calculateTimeToOffer,
  getMonthlyApplications
} from "@/lib/analyticsService";

export default function Analytics() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalJobs: 0,
    applicationsSent: 0,
    responseRate: 0,
    avgTimePerStage: {} as Record<string, number>,
    deadlineAdherence: 0,
    timeToOffer: 0,
  });
  const { exportJobsToCSV } = useExport();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await api.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch jobs and status history
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false);
      
      if (jobsError) throw jobsError;

      const { data: historyData, error: historyError } = await supabase
        .from('application_status_history')
        .select('*')
        .eq('user_id', user.id);
      
      if (historyError) throw historyError;

      setJobs(jobsData || []);
      setStatusHistory(historyData || []);

      // Calculate KPIs
      const totalJobs = jobsData?.length || 0;
      const applicationsSent = jobsData?.filter(j => 
        ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'].includes(j.status)
      ).length || 0;

      // Response rate: jobs that advanced beyond Applied
      const advancedJobIds = new Set(
        historyData?.filter(h => 
          ['Phone Screen', 'Interview', 'Offer', 'Rejected'].includes(h.to_status)
        ).map(h => h.job_id)
      );
      const respondedJobs = jobsData?.filter(j => 
        advancedJobIds.has(j.id) || 
        ['Phone Screen', 'Interview', 'Offer', 'Rejected'].includes(j.status)
      ).length || 0;
      const responseRate = applicationsSent > 0 ? 
        Math.round((respondedJobs / applicationsSent) * 100) : 0;

      // Calculate stage times
      const avgTimePerStage = calculateAverageTimeInStage(jobsData || [], historyData || []);
      const deadlineAdherence = calculateDeadlineAdherence(jobsData || [], historyData || []);
      const timeToOffer = calculateTimeToOffer(jobsData || [], historyData || []);

      setKpis({
        totalJobs,
        applicationsSent,
        responseRate,
        avgTimePerStage,
        deadlineAdherence,
        timeToOffer,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const statusCounts = jobs.reduce((acc, job) => {
    const normalizedStatus = job.status.toLowerCase().replace(/\s+/g, '_');
    acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: 'Interested', value: statusCounts['interested'] || 0 },
    { name: 'Applied', value: statusCounts['applied'] || 0 },
    { name: 'Phone Screen', value: statusCounts['phone_screen'] || 0 },
    { name: 'Interview', value: statusCounts['interview'] || 0 },
    { name: 'Offer', value: statusCounts['offer'] || 0 },
    { name: 'Rejected', value: statusCounts['rejected'] || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  const monthlyData = getMonthlyApplications(jobs, 6);

  const handleExportCSV = () => {
    const analyticsData = {
      totalApplications: kpis.applicationsSent,
      interviewRate: kpis.responseRate,
      offerRate: ((statusCounts['Offer'] || 0) / (kpis.totalJobs || 1) * 100).toFixed(1),
      rejectionRate: ((statusCounts['Rejected'] || 0) / (kpis.totalJobs || 1) * 100).toFixed(1),
      activeApplications: statusCounts['Applied'] || 0,
      avgTimeToInterview: kpis.avgTimePerStage['Interview'] || null,
      avgTimeToOffer: kpis.timeToOffer,
      deadlineAdherence: kpis.deadlineAdherence,
    };
    exportAnalyticsToCSV(analyticsData);
  };

  const handleExportJobs = () => {
    exportJobsToCSV(jobs, `jobs-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Job Search Analytics</h1>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
            <Button onClick={handleExportJobs}>
              <Download className="h-4 w-4 mr-2" />
              Export Jobs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.responseRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deadline Adherence</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.deadlineAdherence}%</div>
              <p className="text-xs text-muted-foreground mt-1">On-time applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Time to Offer</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.timeToOffer !== null ? `${kpis.timeToOffer}d` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data to display. Add jobs to see the pipeline.
                </div>
              ) : (
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              )}
            </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data to display. Add jobs to see the distribution.
                </div>
              ) : (
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg Time in Stage (Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(kpis.avgTimePerStage).map(([stage, days]) => (
                  <div key={stage} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{stage}</span>
                    <span className="font-semibold">{days} days</span>
                  </div>
                ))}
                {Object.keys(kpis.avgTimePerStage).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Not enough data yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
