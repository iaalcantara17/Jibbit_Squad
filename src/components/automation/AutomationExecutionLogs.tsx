import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ExecutionLog {
  id: string;
  rule_id: string;
  job_id: string | null;
  run_at: string;
  outcome: 'success' | 'skipped' | 'error';
  message: string | null;
  automation_rules?: {
    name: string;
  };
  jobs?: {
    job_title: string;
    company_name: string;
  };
}

export const AutomationExecutionLogs = () => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filterOutcome]);

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('automation_rule_runs')
        .select(`
          *,
          automation_rules (name),
          jobs (job_title, company_name)
        `)
        .order('run_at', { ascending: false })
        .limit(100);

      if (filterOutcome !== 'all') {
        query = query.eq('outcome', filterOutcome);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs(data as ExecutionLog[] || []);
    } catch (error) {
      console.error('Failed to load execution logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const variants = {
      success: 'default',
      skipped: 'secondary',
      error: 'destructive',
    };
    return (
      <Badge variant={variants[outcome as keyof typeof variants] as any}>
        {outcome}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Execution Logs</CardTitle>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold">
                    {log.automation_rules?.name || 'Unknown Rule'}
                  </div>
                  {log.jobs && (
                    <div className="text-sm text-muted-foreground">
                      {log.jobs.job_title} at {log.jobs.company_name}
                    </div>
                  )}
                </div>
                {getOutcomeBadge(log.outcome)}
              </div>
              {log.message && (
                <div className="text-sm text-muted-foreground mb-2">{log.message}</div>
              )}
              <div className="text-xs text-muted-foreground">
                {format(new Date(log.run_at), 'PPpp')}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No execution logs found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
