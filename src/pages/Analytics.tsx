import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, Target, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useExport } from "@/hooks/useExport";
import { Navigation } from "@/components/Navigation";
import { exportAnalyticsToCSV } from "@/lib/csvExportService";
import {
  calculateAverageTimeInStage,
  calculateDeadlineAdherence,
  calculateTimeToOffer,
  getMonthlyApplications
} from "@/lib/analyticsService";

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { exportJobsToCSV } = useExport();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, jobsData] = await Promise.all([
        api.jobs.getStats(),
        api.jobs.getAll({ isArchived: false })
      ]);
      setStats(statsData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const statusData = stats?.byStatus ? [
    { name: 'Interested', value: stats.byStatus.interested },
    { name: 'Applied', value: stats.byStatus.applied },
    { name: 'Phone Screen', value: stats.byStatus.phoneScreen },
    { name: 'Interview', value: stats.byStatus.interview },
    { name: 'Offer', value: stats.byStatus.offer },
    { name: 'Rejected', value: stats.byStatus.rejected },
  ] : [];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  const responseRate = stats?.byStatus && stats.byStatus.applied > 0 ? 
    ((stats.byStatus.phoneScreen + stats.byStatus.interview + stats.byStatus.offer) / 
    stats.byStatus.applied * 100).toFixed(1) : '0';

  // Enhanced analytics calculations
  const avgTimeInStage = calculateAverageTimeInStage(jobs);
  const deadlineAdherence = calculateDeadlineAdherence(jobs);
  const timeToOffer = calculateTimeToOffer(jobs);
  const monthlyData = getMonthlyApplications(jobs, 6);

  const handleExportCSV = () => {
    const analyticsData = {
      totalApplications: stats?.total || 0,
      interviewRate: responseRate,
      offerRate: ((stats?.byStatus?.offer || 0) / (stats?.total || 1) * 100).toFixed(1),
      rejectionRate: ((stats?.byStatus?.rejected || 0) / (stats?.total || 1) * 100).toFixed(1),
      activeApplications: stats?.byStatus?.applied || 0,
      avgTimeToInterview: null,
      avgTimeToOffer: timeToOffer,
      deadlineAdherence,
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
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responseRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deadline Adherence</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deadlineAdherence}%</div>
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
                {timeToOffer !== null ? `${timeToOffer}d` : 'N/A'}
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
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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
                {Object.entries(avgTimeInStage).map(([stage, days]) => (
                  <div key={stage} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{stage}</span>
                    <span className="font-semibold">{days} days</span>
                  </div>
                ))}
                {Object.keys(avgTimeInStage).length === 0 && (
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
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.upcomingDeadlines?.length > 0 ? (
              <div className="space-y-2">
                {stats.upcomingDeadlines.map((item: any) => (
                  <div key={item.jobId} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{item.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">{item.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.daysUntil} days</p>
                      <p className="text-sm text-muted-foreground">{new Date(item.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No upcoming deadlines</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
