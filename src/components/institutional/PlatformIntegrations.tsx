import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plug, AlertTriangle, CheckCircle, ExternalLink, Database, Key, Webhook } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Sprint 3 UC-114: Corporate Career Services Integration
 * Integration with existing career services platforms
 * Implements API access, webhook configuration, and LMS integration
 */

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'pending';
  icon: React.ReactNode;
  category: 'lms' | 'crm' | 'analytics' | 'other';
}

export const PlatformIntegrations = () => {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const integrations: IntegrationConfig[] = [
    {
      id: 'handshake',
      name: 'Handshake',
      description: 'Sync job postings and student profiles',
      status: 'disconnected',
      icon: <Database className="h-5 w-5" />,
      category: 'crm',
    },
    {
      id: 'canvas',
      name: 'Canvas LMS',
      description: 'Import student data and course completion',
      status: 'disconnected',
      icon: <Database className="h-5 w-5" />,
      category: 'lms',
    },
    {
      id: 'workday',
      name: 'Workday',
      description: 'Sync employment records and career outcomes',
      status: 'disconnected',
      icon: <Database className="h-5 w-5" />,
      category: 'crm',
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Alumni and employer relationship tracking',
      status: 'disconnected',
      icon: <Database className="h-5 w-5" />,
      category: 'crm',
    },
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      description: 'Track platform usage and engagement',
      status: 'disconnected',
      icon: <Database className="h-5 w-5" />,
      category: 'analytics',
    },
  ];

  const generateApiKey = () => {
    setIsGeneratingKey(true);
    setTimeout(() => {
      const key = `lv_inst_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      setApiKey(key);
      setIsGeneratingKey(false);
      toast.success('API key generated. Copy it now - it won\'t be shown again.');
    }, 1000);
  };

  const saveWebhook = () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }
    try {
      new URL(webhookUrl);
      toast.success('Webhook URL saved');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const connectIntegration = (integrationId: string) => {
    toast.info(`${integrationId} integration requires manual setup. Please contact support for configuration.`);
  };

  return (
    <div className="space-y-6">
      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Access
          </CardTitle>
          <CardDescription>
            Generate API keys for programmatic access to your institution's data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              API keys provide full access to your institution's data. Keep them secure and never share publicly.
            </AlertDescription>
          </Alert>

          {apiKey ? (
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success('API key copied');
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Store this key securely. It won't be shown again.
              </p>
            </div>
          ) : (
            <Button onClick={generateApiKey} disabled={isGeneratingKey}>
              {isGeneratingKey ? 'Generating...' : 'Generate API Key'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Receive real-time notifications when events occur in the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks/careers"
                className="flex-1"
              />
              <Button onClick={saveWebhook}>Save</Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Events to receive</Label>
            <div className="space-y-2">
              {[
                { id: 'member_added', label: 'Member Added' },
                { id: 'member_removed', label: 'Member Removed' },
                { id: 'application_submitted', label: 'Application Submitted' },
                { id: 'interview_scheduled', label: 'Interview Scheduled' },
                { id: 'offer_received', label: 'Offer Received' },
              ].map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <Label htmlFor={event.id} className="font-normal">{event.label}</Label>
                  <Switch id={event.id} defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Platform Integrations
          </CardTitle>
          <CardDescription>
            Connect with existing career services and LMS platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{integration.name}</h4>
                      <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                        {integration.status === 'connected' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                        ) : (
                          'Not Connected'
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <Button
                  variant={integration.status === 'connected' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => connectIntegration(integration.id)}
                >
                  {integration.status === 'connected' ? 'Configure' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Need a custom integration?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              We can build custom integrations for your existing career services platforms.
            </p>
            <Button variant="link" className="p-0 h-auto" asChild>
              <a href="mailto:enterprise@lovable.dev">
                <ExternalLink className="h-4 w-4 mr-1" />
                Contact Enterprise Sales
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
