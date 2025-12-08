import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield
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
  ResponsiveContainer
} from 'recharts';

interface ApiRateLimit {
  id: string;
  api_name: string;
  daily_limit: number;
  current_usage: number;
  reset_at: string;
  last_error: string | null;
  last_error_at: string | null;
  average_response_ms: number | null;
}

interface ApiUsageLog {
  id: string;
  api_name: string;
  endpoint: string;
  response_status: number;
  response_time_ms: number;
  error_message: string | null;
  created_at: string;
}

export default function ApiAdminDashboard() {
  const { user } = useAuth();
  const [rateLimits, setRateLimits] = useState<ApiRateLimit[]>([]);
  const [usageLogs, setUsageLogs] = useState<ApiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch rate limits
      const { data: limits, error: limitsError } = await supabase
        .from('api_rate_limits')
        .select('*')
        .order('api_name');

      if (limitsError) throw limitsError;
      setRateLimits(limits || []);

      // Fetch recent usage logs
      const { data: logs, error: logsError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setUsageLogs(logs || []);
    } catch (err) {
      console.error('Failed to fetch API data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUsagePercentage = (usage: number, limit: number) => {
    return Math.min(100, (usage / limit) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
  };

  const errorLogs = usageLogs.filter(log => log.error_message || (log.response_status && log.response_status >= 400));
  const successLogs = usageLogs.filter(log => !log.error_message && (!log.response_status || log.response_status < 400));

  // Group logs by hour for chart
  const hourlyData = usageLogs.reduce((acc, log) => {
    const hour = new Date(log.created_at).toISOString().slice(0, 13);
    if (!acc[hour]) {
      acc[hour] = { hour, calls: 0, errors: 0, avgResponseTime: 0 };
    }
    acc[hour].calls++;
    if (log.error_message || (log.response_status && log.response_status >= 400)) {
      acc[hour].errors++;
    }
    acc[hour].avgResponseTime = (acc[hour].avgResponseTime + (log.response_time_ms || 0)) / 2;
    return acc;
  }, {} as Record<string, { hour: string; calls: number; errors: number; avgResponseTime: number }>);

  const chartData = Object.values(hourlyData).slice(-24).map(d => ({
    ...d,
    hour: new Date(d.hour).toLocaleTimeString([], { hour: '2-digit' })
  }));

  const totalCalls = usageLogs.length;
  const errorRate = totalCalls > 0 ? (errorLogs.length / totalCalls * 100).toFixed(1) : 0;
  const avgResponseTime = usageLogs.length > 0 
    ? Math.round(usageLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / usageLogs.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                <Activity className="h-10 w-10 text-primary" />
                API Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Monitor API usage, rate limits, and error logs
              </p>
            </div>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total API Calls (24h)</p>
                    <p className="text-3xl font-bold">{totalCalls}</p>
                  </div>
                  <Zap className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className={`text-3xl font-bold ${Number(errorRate) > 5 ? 'text-destructive' : 'text-success'}`}>
                      {errorRate}%
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-warning opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-3xl font-bold">{avgResponseTime}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-secondary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">APIs Monitored</p>
                    <p className="text-3xl font-bold">{rateLimits.length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="rate-limits" className="w-full">
            <TabsList>
              <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
              <TabsTrigger value="usage-chart">Usage Trends</TabsTrigger>
              <TabsTrigger value="error-logs">Error Logs ({errorLogs.length})</TabsTrigger>
              <TabsTrigger value="all-logs">All Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="rate-limits" className="mt-6">
              <div className="space-y-4">
                {rateLimits.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No API rate limits configured yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  rateLimits.map(api => {
                    const percentage = getUsagePercentage(api.current_usage, api.daily_limit);
                    return (
                      <Card key={api.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${percentage >= 90 ? 'bg-destructive' : percentage >= 70 ? 'bg-warning' : 'bg-success'}`} />
                              <div>
                                <p className="font-semibold">{api.api_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Resets: {new Date(api.reset_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getStatusColor(percentage)}`}>
                                {api.current_usage.toLocaleString()} / {api.daily_limit.toLocaleString()}
                              </p>
                              {api.average_response_ms && (
                                <p className="text-sm text-muted-foreground">
                                  Avg: {api.average_response_ms}ms
                                </p>
                              )}
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          
                          {percentage >= 90 && (
                            <Alert className="mt-4 border-destructive bg-destructive/10">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <AlertTitle className="text-destructive">Critical: Rate Limit Warning</AlertTitle>
                              <AlertDescription>
                                You've used {percentage.toFixed(0)}% of your daily quota. Consider optimizing API calls.
                              </AlertDescription>
                            </Alert>
                          )}

                          {api.last_error && (
                            <Alert className="mt-4 border-warning">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                Last error: {api.last_error} 
                                ({api.last_error_at ? new Date(api.last_error_at).toLocaleString() : 'Unknown'})
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="usage-chart" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Usage Over Time</CardTitle>
                  <CardDescription>Hourly API calls and errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="calls" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="API Calls"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="errors" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                          name="Errors"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="error-logs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Error Logs</CardTitle>
                  <CardDescription>Recent API errors and failures</CardDescription>
                </CardHeader>
                <CardContent>
                  {errorLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-success mb-2" />
                      <p className="text-muted-foreground">No errors in the last 24 hours!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {errorLogs.map(log => (
                        <div key={log.id} className="p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">{log.api_name}</Badge>
                              <Badge variant="outline">{log.response_status || 'Error'}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.endpoint}</p>
                          {log.error_message && (
                            <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all-logs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All API Logs</CardTitle>
                  <CardDescription>Recent API calls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {usageLogs.slice(0, 50).map(log => (
                      <div key={log.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {log.response_status && log.response_status < 400 ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{log.api_name}</p>
                            <p className="text-xs text-muted-foreground">{log.endpoint}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={log.response_status && log.response_status < 400 ? 'secondary' : 'destructive'}>
                            {log.response_status || 'Error'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.response_time_ms}ms • {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
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
