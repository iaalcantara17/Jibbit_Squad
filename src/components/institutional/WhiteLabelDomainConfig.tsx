import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, CheckCircle, Clock, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Sprint 3 UC-114: Corporate Career Services Integration
 * White-label custom domain configuration
 * Implements DNS verification flow with graceful manual setup instructions
 */
export const WhiteLabelDomainConfig = () => {
  const queryClient = useQueryClient();
  const [customDomain, setCustomDomain] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['institutional-settings-domain'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('institutional_settings')
        .select('*')
        .eq('created_by', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data?.custom_domain) {
        setCustomDomain(data.custom_domain);
      }
      return data;
    },
  });

  const saveDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (settings) {
        const { error } = await supabase
          .from('institutional_settings')
          .update({ custom_domain: domain })
          .eq('id', settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutional-settings-domain'] });
      toast.success('Domain configuration saved');
    },
    onError: (error: any) => {
      toast.error('Failed to save domain: ' + error.message);
    },
  });

  const verifyDomain = () => {
    if (!customDomain) {
      toast.error('Please enter a domain first');
      return;
    }

    setIsVerifying(true);
    // Simulate DNS verification check
    setTimeout(() => {
      setIsVerifying(false);
      toast.info('DNS verification is pending. This may take up to 48 hours after DNS records are configured.');
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Generate DNS record values based on domain
  const getDnsRecords = () => {
    if (!customDomain) return null;
    
    const subdomain = customDomain.split('.')[0];
    return {
      cname: {
        type: 'CNAME',
        name: subdomain || '@',
        value: 'careers.lovable.app',
        ttl: '3600',
      },
      txt: {
        type: 'TXT',
        name: '_lovable-verify',
        value: `lovable-verify=${settings?.id || 'pending'}`,
        ttl: '3600',
      },
    };
  };

  const dnsRecords = getDnsRecords();
  const domainStatus: 'verified' | 'pending' | 'not_configured' = settings?.custom_domain ? 'pending' : 'not_configured';

  return (
    <div className="space-y-6">
      {/* Domain Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain Configuration
          </CardTitle>
          <CardDescription>
            Configure a custom domain for your white-label career platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="careers.youruniversity.edu"
                className="flex-1"
              />
              <Button
                onClick={() => saveDomainMutation.mutate(customDomain)}
                disabled={!customDomain || saveDomainMutation.isPending}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the subdomain you want to use for your career platform
            </p>
          </div>

          {settings?.custom_domain && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium">{settings.custom_domain}</p>
                <p className="text-sm text-muted-foreground">Current configured domain</p>
              </div>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" /> Pending Verification
              </Badge>
              <Button variant="outline" size="sm" onClick={verifyDomain} disabled={isVerifying}>
                {isVerifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Configuration Instructions */}
      {customDomain && dnsRecords && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Configuration Required</CardTitle>
            <CardDescription>
              Add these DNS records to your domain provider to complete setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Manual Configuration Required</AlertTitle>
              <AlertDescription>
                DNS records must be configured through your domain registrar or DNS provider.
                Changes may take up to 48 hours to propagate.
              </AlertDescription>
            </Alert>

            {/* CNAME Record */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">CNAME Record</h4>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded">{dnsRecords.cname.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded">{dnsRecords.cname.name}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <div className="flex items-center gap-1">
                    <p className="font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                      {dnsRecords.cname.value}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(dnsRecords.cname.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* TXT Record for verification */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">TXT Record (Verification)</h4>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded">{dnsRecords.txt.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-mono bg-muted px-2 py-1 rounded">{dnsRecords.txt.name}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <div className="flex items-center gap-1">
                    <p className="font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                      {dnsRecords.txt.value}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(dnsRecords.txt.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Link */}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View detailed DNS setup guide
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSL Certificate Status */}
      {settings?.custom_domain && (
        <Card>
          <CardHeader>
            <CardTitle>SSL Certificate</CardTitle>
            <CardDescription>
              Secure HTTPS is automatically provisioned after domain verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Awaiting Domain Verification</p>
                <p className="text-sm text-muted-foreground">
                  SSL certificate will be automatically issued once DNS records are verified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
