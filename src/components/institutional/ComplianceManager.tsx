import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ComplianceManager = () => {
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: retentionPolicies } = useQuery({
    queryKey: ['retention-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*, institutional_settings(institution_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance & Security
          </CardTitle>
          <CardDescription>
            Data retention policies and audit logs for regulatory compliance
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {retentionPolicies?.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{policy.entity_type}</h4>
                  <p className="text-sm text-muted-foreground">
                    Retain for {policy.retention_days} days
                  </p>
                </div>
                <Badge variant={policy.auto_delete ? 'default' : 'secondary'}>
                  {policy.auto_delete ? 'Auto-delete enabled' : 'Manual review'}
                </Badge>
              </div>
            ))}
            {retentionPolicies?.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No retention policies configured
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track all user actions for compliance and security monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs?.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 border-b last:border-0 text-sm">
                <div className="flex-1">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground"> on {log.entity_type}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
            {auditLogs?.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                No audit logs yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
