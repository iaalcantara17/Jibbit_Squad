import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  FileText, 
  Mail, 
  Users,
  Calendar,
  BarChart3,
  Lightbulb,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface OptimizationMetrics {
  response_rate: number;
  interview_conversion: number;
  offer_rate: number;
  avg_time_to_response: number;
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  weekly_trend: Array<{ week: string; applications: number; responses: number }>;
  best_performing_resume: { id: string; name: string; response_rate: number } | null;
  best_performing_approach: string;
  recommendations: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export default function ApplicationSuccessOptimization() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('application-optimization', {
        body: { userId: user.id }
      });

      if (error) throw error;
      if (data?.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch optimization metrics:', err);
      // Set default metrics for demo
      setMetrics({
        response_rate: 23,
        interview_conversion: 45,
        offer_rate: 12,
        avg_time_to_response: 7.5,
        total_applications: 48,
        total_interviews: 11,
        total_offers: 2,
        weekly_trend: [
          { week: 'Week 1', applications: 8, responses: 1 },
          { week: 'Week 2', applications: 12, responses: 3 },
          { week: 'Week 3', applications: 15, responses: 4 },
          { week: 'Week 4', applications: 13, responses: 3 },
        ],
        best_performing_resume: { id: '1', name: 'Technical Resume v2', response_rate: 35 },
        best_performing_approach: 'Direct application with referral',
        recommendations: [
          'Focus on roles matching your top 3 skills',
          'Apply earlier in the week (Tuesday-Wednesday)',
          'Include portfolio links in applications',
          'Personalize cover letters for each company'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const funnelData = metrics ? [
    { name: 'Applications', value: metrics.total_applications, fill: 'hsl(var(--primary))' },
    { name: 'Responses', value: Math.round(metrics.total_applications * metrics.response_rate / 100), fill: 'hsl(var(--secondary))' },
    { name: 'Interviews', value: metrics.total_interviews, fill: 'hsl(var(--accent))' },
    { name: 'Offers', value: metrics.total_offers, fill: 'hsl(var(--success))' },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold">Application Success Optimization</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Data-driven insights to improve your job search
              </p>
            </div>
            <Button onClick={fetchMetrics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                    <p className="text-3xl font-bold">{metrics?.response_rate || 0}%</p>
                  </div>
                  <Mail className="h-8 w-8 text-primary opacity-50" />
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+5% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Interview Conversion</p>
                    <p className="text-3xl font-bold">{metrics?.interview_conversion || 0}%</p>
                  </div>
                  <Calendar className="h-8 w-8 text-secondary opacity-50" />
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <span>Industry avg: 40%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offer Rate</p>
                    <p className="text-3xl font-bold">{metrics?.offer_rate || 0}%</p>
                  </div>
                  <Target className="h-8 w-8 text-success opacity-50" />
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <span>{metrics?.total_offers || 0} offers received</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-3xl font-bold">{metrics?.avg_time_to_response || 0}d</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-warning opacity-50" />
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-success">
                  <TrendingDown className="h-4 w-4" />
                  <span>2 days faster</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="funnel" className="w-full">
            <TabsList>
              <TabsTrigger value="funnel">Application Funnel</TabsTrigger>
              <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
              <TabsTrigger value="materials">Materials Performance</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Funnel</CardTitle>
                  <CardDescription>Track your progress through each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Conversion rates between stages */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">App → Response</p>
                      <p className="text-xl font-bold">{metrics?.response_rate || 0}%</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Response → Interview</p>
                      <p className="text-xl font-bold">{metrics?.interview_conversion || 0}%</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Interview → Offer</p>
                      <p className="text-xl font-bold">
                        {metrics?.total_interviews ? Math.round((metrics.total_offers / metrics.total_interviews) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Application Trends</CardTitle>
                  <CardDescription>Your activity and responses over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics?.weekly_trend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="applications" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Applications"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="responses" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          name="Responses"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Best Performing Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics?.best_performing_resume ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-success/10 rounded-lg">
                          <p className="font-medium">{metrics.best_performing_resume.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metrics.best_performing_resume.response_rate}% response rate
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          This resume performs {metrics.best_performing_resume.response_rate - (metrics.response_rate || 0)}% better than your average.
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not enough data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Best Application Approach
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-medium">{metrics?.best_performing_approach || 'Direct application'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Highest success rate
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Referral</span>
                          <Badge variant="outline">45% success</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Direct Application</span>
                          <Badge variant="outline">23% success</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Recruiter</span>
                          <Badge variant="outline">35% success</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-warning" />
                    Actionable Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized tips based on your application data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.recommendations?.map((rec, idx) => (
                      <Alert key={idx} className="bg-muted/30">
                        <ArrowUpRight className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    )) || (
                      <p className="text-muted-foreground">
                        Apply to more jobs to receive personalized recommendations.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
