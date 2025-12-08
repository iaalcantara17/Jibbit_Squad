import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield, FileText, Info, CreditCard, Globe, Plug } from 'lucide-react';
import { InstitutionalSettings } from '@/components/institutional/InstitutionalSettings';
import { BulkOnboarding } from '@/components/institutional/BulkOnboarding';
import { ComplianceManager } from '@/components/institutional/ComplianceManager';
import { AggregateReporting } from '@/components/institutional/AggregateReporting';
import { BillingSubscriptionManager } from '@/components/institutional/BillingSubscriptionManager';
import { WhiteLabelDomainConfig } from '@/components/institutional/WhiteLabelDomainConfig';
import { PlatformIntegrations } from '@/components/institutional/PlatformIntegrations';

/**
 * Sprint 3 UC-114: Corporate Career Services Integration
 * Institutional admin dashboard for managing career services at scale
 */
const InstitutionalAdmin = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8 max-w-7xl mx-auto px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">Institutional Admin</h1>
              <p className="text-muted-foreground">Career services platform management</p>
            </div>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Institutional Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Institutional features are designed for universities, career centers, and organizations managing large groups of job seekers.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>White-Label Settings:</strong> Customize branding, colors, and domain for your institution</li>
                <li><strong>Bulk Onboarding:</strong> Import and manage cohorts of students or participants</li>
                <li><strong>Compliance:</strong> FERPA, GDPR, and data retention policy management</li>
                <li><strong>Reporting:</strong> Aggregate analytics across all participants</li>
                <li><strong>Billing:</strong> Subscription management for team accounts</li>
                <li><strong>Integrations:</strong> Connect with existing career services platforms</li>
              </ul>
            </CardContent>
          </Card>

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="domain" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Domain</span>
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Onboarding</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Compliance</span>
              </TabsTrigger>
              <TabsTrigger value="reporting" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Reporting</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Plug className="h-4 w-4" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <InstitutionalSettings />
            </TabsContent>

            <TabsContent value="domain" className="space-y-6 mt-6">
              <WhiteLabelDomainConfig />
            </TabsContent>

            <TabsContent value="onboarding" className="space-y-6 mt-6">
              <BulkOnboarding />
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6 mt-6">
              <ComplianceManager />
            </TabsContent>

            <TabsContent value="reporting" className="space-y-6 mt-6">
              <AggregateReporting />
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 mt-6">
              <BillingSubscriptionManager />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6 mt-6">
              <PlatformIntegrations />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalAdmin;