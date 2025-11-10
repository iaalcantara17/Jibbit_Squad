import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function JobAnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [jobsData] = await Promise.all([
        api.jobs.getAll()
      ]);
      setJobs(jobsData);
      calculateStats(jobsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobsData: any[]) => {
    const statusCounts = jobsData.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalJobs = jobsData.length;
    const appliedJobs = statusCounts['applied'] || 0;
    const interviewJobs = (statusCounts['phone_screen'] || 0) + (statusCounts['interview'] || 0);
    const offers = statusCounts['offer'] || 0;
    const rejected = statusCounts['rejected'] || 0;

    const responseRate = appliedJobs > 0 ? ((interviewJobs / appliedJobs) * 100).toFixed(1) : '0';
    const offerRate = appliedJobs > 0 ? ((offers / appliedJobs) * 100).toFixed(1) : '0';

    setStats({
      totalJobs,
      appliedJobs,
      interviewJobs,
      offers,
      rejected,
      responseRate,
      offerRate,
      statusCounts,
    });
  };

  const statusDistribution = stats ? [
    { name: 'Interested', value: stats.statusCounts['interested'] || 0 },
    { name: 'Applied', value: stats.statusCounts['applied'] || 0 },
    { name: 'Phone Screen', value: stats.statusCounts['phone_screen'] || 0 },
    { name: 'Interview', value: stats.statusCounts['interview'] || 0 },
    { name: 'Offer', value: stats.statusCounts['offer'] || 0 },
    { name: 'Rejected', value: stats.statusCounts['rejected'] || 0 },
  ] : [];

  const funnelData = stats ? [
    { stage: 'Applied', count: stats.appliedJobs },
    { stage: 'Phone Screen', count: stats.statusCounts['phone_screen'] || 0 },
    { stage: 'Interview', count: stats.statusCounts['interview'] || 0 },
    { stage: 'Offer', count: stats.offers },
  ] : [];

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Tracked</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appliedJobs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.responseRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.interviewJobs || 0} interviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.offerRate || 0}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentValue = typeof percent === 'number' ? percent : 0;
                    return `${name}: ${(percentValue * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{job.job_title}</p>
                  <p className="text-sm text-muted-foreground">{job.company_name}</p>
                </div>
                <Badge variant={
                  job.status === 'offer' ? 'default' :
                  job.status === 'rejected' ? 'destructive' :
                  job.status === 'interview' ? 'secondary' :
                  'outline'
                }>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
