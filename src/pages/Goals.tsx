import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Target, CheckCircle2, Trophy, Calendar, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import confetti from "canvas-confetti";

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "applications",
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    time_bound: "",
    target_value: "",
    target_date: "",
    is_shared: false,
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Failed to load goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const goalData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        specific: formData.specific,
        measurable: formData.measurable,
        achievable: formData.achievable,
        relevant: formData.relevant,
        time_bound: formData.time_bound,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        target_date: formData.target_date || null,
        is_shared: formData.is_shared,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("goals")
          .update(goalData)
          .eq("id", editingGoal.id);
        if (error) throw error;
        toast.success("Goal updated!");
      } else {
        const { error } = await supabase.from("goals").insert([goalData]);
        if (error) throw error;
        toast.success("Goal created!");
      }

      setDialogOpen(false);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error("Failed to save goal:", error);
      toast.error("Failed to save goal");
    }
  };

  const handleCompleteGoal = async (goal: any) => {
    try {
      const { error } = await supabase
        .from("goals")
        .update({ status: "completed", current_value: goal.target_value })
        .eq("id", goal.id);

      if (error) throw error;

      // Celebration UI
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("🎉 Goal completed! Congratulations!");
      loadGoals();
    } catch (error) {
      console.error("Failed to complete goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Goal deleted");
      loadGoals();
    } catch (error) {
      console.error("Failed to delete goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      specific: goal.specific || "",
      measurable: goal.measurable || "",
      achievable: goal.achievable || "",
      relevant: goal.relevant || "",
      time_bound: goal.time_bound || "",
      target_value: goal.target_value?.toString() || "",
      target_date: goal.target_date || "",
      is_shared: goal.is_shared || false,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      title: "",
      description: "",
      category: "applications",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      time_bound: "",
      target_value: "",
      target_date: "",
      is_shared: false,
    });
  };

  const getProgressPercentage = (goal: any) => {
    if (!goal.target_value) return 0;
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">SMART Goals</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Goal" : "Create SMART Goal"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Get 5 interviews by end of month"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applications">Applications</SelectItem>
                      <SelectItem value="interviews">Interviews</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="skill_development">Skill Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold">SMART Criteria</h3>

                  <div className="space-y-2">
                    <Label>Specific - What will you accomplish?</Label>
                    <Textarea
                      value={formData.specific}
                      onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                      placeholder="Be specific about what you want to achieve"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Measurable - How will you measure progress?</Label>
                    <Textarea
                      value={formData.measurable}
                      onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                      placeholder="Define how you'll track progress"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Achievable - Why is this goal realistic?</Label>
                    <Textarea
                      value={formData.achievable}
                      onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                      placeholder="Explain why this goal is achievable"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Relevant - Why does this goal matter?</Label>
                    <Textarea
                      value={formData.relevant}
                      onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                      placeholder="Why is this goal important to you?"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time-Bound - When will you complete this?</Label>
                    <Textarea
                      value={formData.time_bound}
                      onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
                      placeholder="Define your timeline"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Value (optional)</Label>
                    <Input
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="e.g., 5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_shared}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
                  />
                  <Label>Share with mentors/collaborators</Label>
                </div>

                <Button onClick={handleSaveGoal} className="w-full">
                  {editingGoal ? "Update Goal" : "Create Goal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Goals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Goals ({activeGoals.length})
          </h2>

          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Active Goals</p>
                <p className="text-muted-foreground text-center mb-4">
                  Create SMART goals to track your job search progress
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {goal.category.replace("_", " ")}
                        </Badge>
                        {goal.is_shared && (
                          <Badge variant="secondary" className="ml-2">
                            Shared
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

                    {goal.target_value && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">
                            {goal.current_value || 0} / {goal.target_value}
                          </span>
                        </div>
                        <Progress value={getProgressPercentage(goal)} />
                      </div>
                    )}

                    {goal.target_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </div>
                    )}

                    <Button variant="outline" className="w-full" onClick={() => handleCompleteGoal(goal)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Completed Goals ({completedGoals.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      {goal.title}
                    </CardTitle>
                    <Badge variant="outline">{goal.category.replace("_", " ")}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Completed on {new Date(goal.updated_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
