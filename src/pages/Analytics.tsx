import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, Target, CheckCircle, Users, Award } from "lucide-react";
import { api } from "@/lib/api";
import { useExport } from "@/hooks/useExport";
import { Navigation } from "@/components/Navigation";
import { exportAnalyticsToCSV } from "@/lib/csvExportService";
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import {
  calculateApplicationsSent,
  calculateInterviewsScheduled,
  calculateOffersReceived,
  calculateConversionRates,
  calculateMedianTimeToResponse,
  calculateAverageTimeInStage,
  calculateDeadlineAdherence,
  calculateTimeToOffer,
  getMonthlyApplications,
  filterJobsByDateRange,
  filterJobsByCompany,
  filterJobsByRole,
  filterJobsByIndustry,
  getUniqueCompanies,
  getUniqueRoles,
  getUniqueIndustries,
} from "@/lib/analyticsService";

export default function Analytics() {
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allInterviews, setAllInterviews] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    totalJobs: 0,
    applicationsSent: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    conversionRates: {
      appliedToInterview: 0,
      interviewToOffer: 0,
      appliedToOffer: 0,
    },
    medianTimeToResponse: null as number | null,
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

      // Fetch jobs, interviews, and status history
      const [
        { data: jobsData, error: jobsError },
        { data: interviewsData, error: interviewsError },
        { data: historyData, error: historyError }
      ] = await Promise.all([
        supabase.from('jobs').select('*').eq('user_id', user.id).eq('is_archived', false),
        supabase.from('interviews').select('*').eq('user_id', user.id),
        supabase.from('application_status_history').select('*').eq('user_id', user.id),
      ]);
      
      if (jobsError) throw jobsError;
      if (interviewsError) throw interviewsError;
      if (historyError) throw historyError;

      setAllJobs(jobsData || []);
      setAllInterviews(interviewsData || []);
      setStatusHistory(historyData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate KPIs when filters change
  useEffect(() => {
    if (allJobs.length === 0) return;

    let filteredJobs = allJobs;
    filteredJobs = filterJobsByDateRange(filteredJobs, startDate, endDate);
    filteredJobs = filterJobsByCompany(filteredJobs, company);
    filteredJobs = filterJobsByRole(filteredJobs, role);
    filteredJobs = filterJobsByIndustry(filteredJobs, industry);

    const applicationsSent = calculateApplicationsSent(filteredJobs);
    const interviewsScheduled = calculateInterviewsScheduled(allInterviews);
    const offersReceived = calculateOffersReceived(filteredJobs);
    const conversionRates = calculateConversionRates(filteredJobs);
    const medianTimeToResponse = calculateMedianTimeToResponse(filteredJobs, statusHistory);
    const avgTimePerStage = calculateAverageTimeInStage(filteredJobs, statusHistory);
    const deadlineAdherence = calculateDeadlineAdherence(filteredJobs, statusHistory);
    const timeToOffer = calculateTimeToOffer(filteredJobs, statusHistory);

    setKpis({
      totalJobs: filteredJobs.length,
      applicationsSent,
      interviewsScheduled,
      offersReceived,
      conversionRates,
      medianTimeToResponse,
      avgTimePerStage,
      deadlineAdherence,
      timeToOffer,
    });
  }, [allJobs, allInterviews, statusHistory, startDate, endDate, company, role, industry]);

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCompany(null);
    setRole(null);
    setIndustry(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Apply filters for display
  let filteredJobs = allJobs;
  filteredJobs = filterJobsByDateRange(filteredJobs, startDate, endDate);
  filteredJobs = filterJobsByCompany(filteredJobs, company);
  filteredJobs = filterJobsByRole(filteredJobs, role);
  filteredJobs = filterJobsByIndustry(filteredJobs, industry);

  const statusCounts = filteredJobs.reduce((acc, job) => {
    const normalizedStatus = job.status.toLowerCase().replace(/\s+/g, '_');
    acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const companies = getUniqueCompanies(allJobs);
  const roles = getUniqueRoles(allJobs);
  const industries = getUniqueIndustries(allJobs);

  const statusData = [
    { name: 'Interested', value: statusCounts['interested'] || 0 },
    { name: 'Applied', value: statusCounts['applied'] || 0 },
    { name: 'Phone Screen', value: statusCounts['phone_screen'] || 0 },
    { name: 'Interview', value: statusCounts['interview'] || 0 },
    { name: 'Offer', value: statusCounts['offer'] || 0 },
    { name: 'Rejected', value: statusCounts['rejected'] || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  const monthlyData = getMonthlyApplications(filteredJobs, 6);

  const handleExportCSV = () => {
    const analyticsData = {
      totalApplications: kpis.applicationsSent,
      interviewRate: kpis.conversionRates.appliedToInterview,
      offerRate: kpis.conversionRates.appliedToOffer,
      rejectionRate: ((statusCounts['Rejected'] || 0) / (kpis.totalJobs || 1) * 100).toFixed(1),
      activeApplications: statusCounts['Applied'] || 0,
      avgTimeToInterview: kpis.avgTimePerStage['Interview'] || null,
      avgTimeToOffer: kpis.timeToOffer,
      deadlineAdherence: kpis.deadlineAdherence,
      medianTimeToResponse: kpis.medianTimeToResponse,
    };
    exportAnalyticsToCSV(analyticsData);
  };

  const handleExportJobs = () => {
    exportJobsToCSV(filteredJobs, `jobs-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
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

        {/* Quick Links to Specialized Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Specialized Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/analytics/application-success"}
              >
                <Target className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Application Success</div>
                  <div className="text-xs text-muted-foreground">By industry, role, customization</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/analytics/interview-performance"}
              >
                <Users className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Interview Performance</div>
                  <div className="text-xs text-muted-foreground">Trends, formats, practice impact</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/analytics/network-roi"}
              >
                <Users className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Network ROI</div>
                  <div className="text-xs text-muted-foreground">Referrals, outcomes, relationships</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/analytics/salary-progression"}
              >
                <Award className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Salary Progression</div>
                  <div className="text-xs text-muted-foreground">Offers, negotiation outcomes</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/goals"}
              >
                <Target className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">SMART Goals</div>
                  <div className="text-xs text-muted-foreground">Track milestones & progress</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/time-investment"}
              >
                <Target className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Time Investment</div>
                  <div className="text-xs text-muted-foreground">Track time vs outcomes</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/custom-reports"}
              >
                <Target className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Custom Reports</div>
                  <div className="text-xs text-muted-foreground">Build & save report templates</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/forecasting"}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Forecasting</div>
                  <div className="text-xs text-muted-foreground">Predict outcomes, track accuracy</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Insights</CardTitle>
            <CardDescription>Pattern detection and market intelligence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/market-intelligence"}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Market Intelligence</div>
                  <div className="text-xs text-muted-foreground">Curate & analyze trends</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/benchmarking"}
              >
                <Target className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Personal Benchmarking</div>
                  <div className="text-xs text-muted-foreground">Set & track targets</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4"
                onClick={() => window.location.href = "/success-patterns"}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Success Patterns</div>
                  <div className="text-xs text-muted-foreground">Learn from your history</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnalyticsFilters
          startDate={startDate}
          endDate={endDate}
          company={company}
          role={role}
          industry={industry}
          companies={companies}
          roles={roles}
          industries={industries}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onCompanyChange={setCompany}
          onRoleChange={setRole}
          onIndustryChange={setIndustry}
          onClearFilters={clearFilters}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.applicationsSent}</div>
              <p className="text-xs text-muted-foreground mt-1">Total submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.interviewsScheduled}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.applicationsSent > 0 ? `${kpis.conversionRates.appliedToInterview}% conversion` : 'No data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.offersReceived}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.applicationsSent > 0 ? `${kpis.conversionRates.appliedToOffer}% conversion` : 'No data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Median Response Time</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.medianTimeToResponse !== null ? `${kpis.medianTimeToResponse}d` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From application</p>
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

      </div>
    </div>
  );
};
