import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Calendar, Mail, CheckCircle2 } from "lucide-react";

interface AutomationRule {
  id: string;
  type: 'follow-up' | 'deadline-reminder' | 'status-update';
  enabled: boolean;
  config: {
    daysAfter?: number;
    daysBefore?: number;
    fromStatus?: string;
    toStatus?: string;
  };
}

export const ApplicationAutomation = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      type: 'follow-up',
      enabled: true,
      config: { daysAfter: 7 }
    },
    {
      id: '2',
      type: 'deadline-reminder',
      enabled: true,
      config: { daysBefore: 3 }
    }
  ]);

  const updateRule = (id: string, updates: Partial<AutomationRule>) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
    toast({
      title: "Automation Updated",
      description: "Your automation rules have been saved",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Application Automation</h3>
        <p className="text-sm text-muted-foreground">
          Automate repetitive tasks in your job search workflow
        </p>
      </div>

      {/* Follow-up Reminders */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <Label className="text-base font-medium">Follow-up Reminders</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get reminded to follow up after applying
                </p>
              </div>
            </div>
            <Switch
              checked={rules.find(r => r.type === 'follow-up')?.enabled}
              onCheckedChange={(checked) => 
                updateRule('1', { enabled: checked })
              }
            />
          </div>
          
          {rules.find(r => r.type === 'follow-up')?.enabled && (
            <div className="pl-8 space-y-2">
              <Label htmlFor="followup-days" className="text-sm">
                Send reminder after
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="followup-days"
                  type="number"
                  min="1"
                  max="30"
                  value={rules.find(r => r.type === 'follow-up')?.config.daysAfter || 7}
                  onChange={(e) => 
                    updateRule('1', { 
                      config: { daysAfter: parseInt(e.target.value) } 
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Deadline Reminders */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <Label className="text-base font-medium">Deadline Reminders</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified before application deadlines
                </p>
              </div>
            </div>
            <Switch
              checked={rules.find(r => r.type === 'deadline-reminder')?.enabled}
              onCheckedChange={(checked) => 
                updateRule('2', { enabled: checked })
              }
            />
          </div>
          
          {rules.find(r => r.type === 'deadline-reminder')?.enabled && (
            <div className="pl-8 space-y-2">
              <Label htmlFor="deadline-days" className="text-sm">
                Remind me
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="deadline-days"
                  type="number"
                  min="1"
                  max="14"
                  value={rules.find(r => r.type === 'deadline-reminder')?.config.daysBefore || 3}
                  onChange={(e) => 
                    updateRule('2', { 
                      config: { daysBefore: parseInt(e.target.value) } 
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days before deadline</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Status Update Automation */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <Label className="text-base font-medium">Auto Status Updates</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically update status based on actions
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="pl-8 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Auto-move to "Applied" when application is submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Auto-move to "Interview" when interview is scheduled</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Application Checklist */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Application Checklist</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Ensure you complete all steps before applying
            </p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Resume tailored for position</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Cover letter customized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Company research completed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Contact information verified</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
