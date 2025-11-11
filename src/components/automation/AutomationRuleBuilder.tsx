import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Trigger, Action } from "@/types/automation";

interface AutomationRule {
  id: string;
  name: string;
  is_enabled: boolean;
  trigger: {
    type: 'status_change' | 'deadline' | 'schedule_daily';
    to?: string;
    days_before?: number;
  };
  action: {
    type: 'send_email' | 'change_status' | 'generate_package';
    to?: string;
    subject?: string;
    body?: string;
    template_id?: string;
  };
}

export const AutomationRuleBuilder = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [editingRule, setEditingRule] = useState<Partial<AutomationRule> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse Json to typed structures
      const parsed: AutomationRule[] = (data || []).map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        is_enabled: row.is_enabled,
        trigger: row.trigger as unknown as Trigger,
        action: row.action as unknown as Action,
      }));
      
      setRules(parsed);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const handleCreateRule = () => {
    setEditingRule({
      name: '',
      is_enabled: true,
      trigger: { type: 'status_change' },
      action: { type: 'send_email' },
    });
    setIsCreating(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule?.name || !editingRule.trigger || !editingRule.action) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isCreating) {
        const { error } = await supabase
          .from('automation_rules')
          .insert({
            name: editingRule.name,
            is_enabled: editingRule.is_enabled,
            trigger: editingRule.trigger as unknown as any,
            action: editingRule.action as unknown as any,
            user_id: user.id,
            rule_type: editingRule.trigger.type,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automation_rules')
          .update(editingRule)
          .eq('id', editingRule.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Rule ${isCreating ? 'created' : 'updated'} successfully`,
      });

      setEditingRule(null);
      setIsCreating(false);
      loadRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast({
        title: "Error",
        description: "Failed to save rule",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const handleRunNow = async (ruleId: string) => {
    try {
      const { error } = await supabase.functions.invoke('execute-automation-rules', {
        body: { mode: 'manual', rule_id: ruleId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rule executed successfully",
      });
    } catch (error) {
      console.error('Failed to execute rule:', error);
      toast({
        title: "Error",
        description: "Failed to execute rule",
        variant: "destructive",
      });
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_enabled: !rule.is_enabled })
        .eq('id', rule.id);

      if (error) throw error;
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  if (editingRule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isCreating ? 'Create' : 'Edit'} Automation Rule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input
              id="rule-name"
              value={editingRule.name || ''}
              onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
              placeholder="e.g., Send reminder 3 days before deadline"
            />
          </div>

          <div>
            <Label htmlFor="trigger-type">Trigger Type</Label>
            <Select
              value={editingRule.trigger?.type}
              onValueChange={(value) =>
                setEditingRule({
                  ...editingRule,
                  trigger: { ...editingRule.trigger!, type: value as any },
                })
              }
            >
              <SelectTrigger id="trigger-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status_change">Status Change</SelectItem>
                <SelectItem value="deadline">Deadline Reminder</SelectItem>
                <SelectItem value="schedule_daily">Daily Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingRule.trigger?.type === 'status_change' && (
            <div>
              <Label htmlFor="trigger-status">To Status</Label>
              <Select
                value={editingRule.trigger.to || ''}
                onValueChange={(value) =>
                  setEditingRule({
                    ...editingRule,
                    trigger: { ...editingRule.trigger!, to: value },
                  })
                }
              >
                <SelectTrigger id="trigger-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {editingRule.trigger?.type === 'deadline' && (
            <div>
              <Label htmlFor="trigger-days">Days Before Deadline</Label>
              <Input
                id="trigger-days"
                type="number"
                min="1"
                value={editingRule.trigger.days_before || 3}
                onChange={(e) =>
                  setEditingRule({
                    ...editingRule,
                    trigger: { ...editingRule.trigger!, days_before: parseInt(e.target.value) },
                  })
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor="action-type">Action Type</Label>
            <Select
              value={editingRule.action?.type}
              onValueChange={(value) =>
                setEditingRule({
                  ...editingRule,
                  action: { ...editingRule.action!, type: value as any },
                })
              }
            >
              <SelectTrigger id="action-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send_email">Send Email</SelectItem>
                <SelectItem value="change_status">Change Status</SelectItem>
                <SelectItem value="generate_package">Generate Application Package</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingRule.action?.type === 'send_email' && (
            <>
              <div>
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  value={editingRule.action.subject || ''}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      action: { ...editingRule.action!, subject: e.target.value },
                    })
                  }
                  placeholder="Application deadline reminder"
                />
              </div>
              <div>
                <Label htmlFor="email-body">Email Body</Label>
                <Textarea
                  id="email-body"
                  value={editingRule.action.body || ''}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      action: { ...editingRule.action!, body: e.target.value },
                    })
                  }
                  placeholder="Your application deadline is approaching..."
                  rows={4}
                />
              </div>
            </>
          )}

          {editingRule.action?.type === 'change_status' && (
            <div>
              <Label htmlFor="action-status">New Status</Label>
              <Select
                value={editingRule.action.to || ''}
                onValueChange={(value) =>
                  setEditingRule({
                    ...editingRule,
                    action: { ...editingRule.action!, to: value },
                  })
                }
              >
                <SelectTrigger id="action-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSaveRule}>Save Rule</Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingRule(null);
                setIsCreating(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Automation Rules</h2>
        <Button onClick={handleCreateRule}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Switch
                      checked={rule.is_enabled}
                      onCheckedChange={() => handleToggleRule(rule)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Trigger: {rule.trigger.type} | Action: {rule.action.type}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunNow(rule.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRule(rule);
                      setIsCreating(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No automation rules yet. Create your first rule to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
