import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Clock, TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function TimeInvestment() {
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "job_search",
    notes: "",
  });

  useEffect(() => {
    loadTracking();
    const interval = setInterval(() => {
      if (activeTimer) {
        setTimerSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const loadTracking = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setTracking(data || []);

      // Check for active timer
      const active = data?.find((t: any) => !t.ended_at);
      if (active) {
        setActiveTimer(active);
        const elapsed = Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000);
        setTimerSeconds(elapsed);
      }
    } catch (error) {
      console.error("Failed to load tracking:", error);
      toast.error("Failed to load time tracking");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("time_tracking")
        .insert([
          {
            user_id: user.id,
            activity_type: formData.activity_type,
            notes: formData.notes,
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setActiveTimer(data);
      setTimerSeconds(0);
      setDialogOpen(false);
      toast.success("Timer started!");
    } catch (error) {
      console.error("Failed to start timer:", error);
      toast.error("Failed to start timer");
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - new Date(activeTimer.started_at).getTime()) / 60000);

      const { error } = await supabase
        .from("time_tracking")
        .update({
          ended_at: endTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq("id", activeTimer.id);

      if (error) throw error;

      setActiveTimer(null);
      setTimerSeconds(0);
      toast.success(`Timer stopped! Duration: ${durationMinutes} minutes`);
      loadTracking();
    } catch (error) {
      console.error("Failed to stop timer:", error);
      toast.error("Failed to stop timer");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateAnalytics = () => {
    const completedTracking = tracking.filter((t) => t.ended_at);

    // By Activity Type
    const byActivity = completedTracking.reduce((acc: any, t: any) => {
      if (!acc[t.activity_type]) acc[t.activity_type] = 0;
      acc[t.activity_type] += t.duration_minutes || 0;
      return acc;
    }, {});

    const activityData = Object.entries(byActivity).map(([name, minutes]) => ({
      name: name.replace(/_/g, " "),
      hours: Number((Number(minutes) / 60).toFixed(1)),
    }));

    // Total time
    const totalMinutes = completedTracking.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = completedTracking.filter((t) => new Date(t.started_at) >= weekAgo);
    const weekMinutes = thisWeek.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
    const weekHours = (weekMinutes / 60).toFixed(1);

    return { activityData, totalHours, weekHours, totalSessions: completedTracking.length };
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const analytics = calculateAnalytics();
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Time Investment Tracking</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Track your time</strong> to understand where your job search efforts go. Use the timer for activities
            and see reports showing time invested versus outcomes.
          </AlertDescription>
        </Alert>

        {/* Active Timer */}
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            {activeTimer ? (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold font-mono">{formatTime(timerSeconds)}</div>
                <Badge variant="default" className="text-sm">
                  {activeTimer.activity_type.replace(/_/g, " ")}
                </Badge>
                {activeTimer.notes && <p className="text-sm text-muted-foreground">{activeTimer.notes}</p>}
                <Button onClick={stopTimer} size="lg" variant="destructive">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No active timer</p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Start Timer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start Time Tracking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Activity Type</Label>
                        <Select
                          value={formData.activity_type}
                          onValueChange={(v) => setFormData({ ...formData, activity_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="job_search">Job Search</SelectItem>
                            <SelectItem value="resume_writing">Resume Writing</SelectItem>
                            <SelectItem value="applications">Filling Applications</SelectItem>
                            <SelectItem value="networking">Networking</SelectItem>
                            <SelectItem value="interview_prep">Interview Prep</SelectItem>
                            <SelectItem value="skill_development">Skill Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="What are you working on?"
                          rows={3}
                        />
                      </div>

                      <Button onClick={startTimer} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalHours}h</div>
              <p className="text-xs text-muted-foreground mt-1">{analytics.totalSessions} sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.weekHours}h</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalSessions > 0
                  ? Math.round((parseFloat(analytics.totalHours) / analytics.totalSessions) * 60)
                  : 0}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per session</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList>
            <TabsTrigger value="breakdown">Time Breakdown</TabsTrigger>
            <TabsTrigger value="history">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Time by Activity Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.activityData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No time tracking data yet. Start a timer!</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#3b82f6" name="Hours" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analytics.activityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => {
                              const p = typeof percent === 'number' ? percent : 0;
                              return `${name}: ${(p * 100).toFixed(0)}%`;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="hours"
                          >
                            {analytics.activityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {tracking.filter((t) => t.ended_at).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No completed sessions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {tracking
                      .filter((t) => t.ended_at)
                      .slice(0, 10)
                      .map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{t.activity_type.replace(/_/g, " ")}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(t.started_at).toLocaleDateString()} at{" "}
                              {new Date(t.started_at).toLocaleTimeString()}
                            </p>
                            {t.notes && <p className="text-sm text-muted-foreground mt-1">{t.notes}</p>}
                          </div>
                          <Badge>{t.duration_minutes} min</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
