import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfWeek, startOfMonth, startOfQuarter, subWeeks, subMonths, subQuarters } from "date-fns";

interface UserBenchmark {
  id: string;
  metric_type: string;
  target_value: number;
  period: string;
}

const METRIC_TYPES = [
  { value: "applications_per_week", label: "Applications per Week" },
  { value: "applications_per_month", label: "Applications per Month" },
  { value: "response_rate", label: "Response Rate (%)" },
  { value: "interview_conversion", label: "Interview Conversion Rate (%)" },
  { value: "networking_events_per_month", label: "Networking Events per Month" },
  { value: "hours_per_week", label: "Hours Invested per Week" },
];

export default function Benchmarking() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    metric_type: "",
    target_value: "",
    period: "",
  });

  const { data: benchmarks = [] } = useQuery({
    queryKey: ["user-benchmarks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_benchmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserBenchmark[];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interviews").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: timeTracking = [] } = useQuery({
    queryKey: ["time-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("time_tracking").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["networking-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("networking_events").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (benchmark: Partial<UserBenchmark>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_benchmarks").insert([{
        user_id: user.id,
        metric_type: benchmark.metric_type!,
        target_value: benchmark.target_value!,
        period: benchmark.period!,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-benchmarks"] });
      toast.success("Benchmark target set");
      setIsDialogOpen(false);
      setFormData({ metric_type: "", target_value: "", period: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_benchmarks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-benchmarks"] });
      toast.success("Benchmark deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      metric_type: formData.metric_type,
      target_value: parseFloat(formData.target_value),
      period: formData.period,
    });
  };

  // Calculate actual performance
  const calculateActual = (metricType: string, period: string) => {
    const now = new Date();
    let startDate: Date;

    if (period === "weekly") {
      startDate = startOfWeek(now);
    } else if (period === "monthly") {
      startDate = startOfMonth(now);
    } else {
      startDate = startOfQuarter(now);
    }

    switch (metricType) {
      case "applications_per_week":
      case "applications_per_month": {
        const appliedJobs = jobs.filter(
          (j) => j.status === "applied" && new Date(j.created_at) >= startDate
        );
        return appliedJobs.length;
      }
      case "response_rate": {
        const appliedJobs = jobs.filter((j) => j.status === "applied");
        const respondedJobs = jobs.filter((j) =>
          ["phone_screen", "interviewing", "offer", "accepted"].includes(j.status)
        );
        return appliedJobs.length > 0 ? (respondedJobs.length / appliedJobs.length) * 100 : 0;
      }
      case "interview_conversion": {
        const totalInterviews = interviews.length;
        const offers = jobs.filter((j) => ["offer", "accepted"].includes(j.status)).length;
        return totalInterviews > 0 ? (offers / totalInterviews) * 100 : 0;
      }
      case "networking_events_per_month": {
        const eventsThisMonth = events.filter(
          (e) => new Date(e.event_date) >= startDate
        );
        return eventsThisMonth.length;
      }
      case "hours_per_week": {
        const hoursThisWeek = timeTracking
          .filter((t) => new Date(t.started_at) >= startDate)
          .reduce((sum, t) => sum + (t.duration_minutes / 60), 0);
        return hoursThisWeek;
      }
      default:
        return 0;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Personal Benchmarking</h1>
          <p className="text-muted-foreground">Set your own targets and track progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Set Benchmark
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Personal Benchmark</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="metric_type">Metric *</Label>
                <Select
                  value={formData.metric_type}
                  onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_value">Target Value *</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.1"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="period">Period *</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Set Benchmark"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">What This Means</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Define your own performance targets—not based on anonymous peers or market data, but on what you want to
            achieve. Track your actual performance against these personal benchmarks to stay accountable.
          </p>
        </CardContent>
      </Card>

      {benchmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No benchmarks set</h3>
            <p className="text-muted-foreground mb-4">
              Set your first personal target to start tracking your progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benchmarks.map((benchmark) => {
            const metricLabel = METRIC_TYPES.find((m) => m.value === benchmark.metric_type)?.label || benchmark.metric_type;
            const actual = calculateActual(benchmark.metric_type, benchmark.period);
            const target = benchmark.target_value;
            const percentage = target > 0 ? (actual / target) * 100 : 0;
            const isOnTrack = percentage >= 100;
            const isClose = percentage >= 80 && percentage < 100;

            return (
              <Card key={benchmark.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{metricLabel}</CardTitle>
                      <CardDescription className="capitalize">{benchmark.period}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(benchmark.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold">{actual.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">of {target} target</div>
                    </div>
                    {isOnTrack ? (
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    ) : isClose ? (
                      <Minus className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOnTrack
                            ? "bg-green-500"
                            : isClose
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
