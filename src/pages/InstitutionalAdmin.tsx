import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Shield, FileText } from 'lucide-react';
import { InstitutionalSettings } from '@/components/institutional/InstitutionalSettings';
import { BulkOnboarding } from '@/components/institutional/BulkOnboarding';
import { ComplianceManager } from '@/components/institutional/ComplianceManager';
import { AggregateReporting } from '@/components/institutional/AggregateReporting';

const InstitutionalAdmin = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">Institutional Admin</h1>
              <p className="text-muted-foreground">Career services platform management</p>
            </div>
          </div>

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                White-Label Settings
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bulk Onboarding
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="reporting" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reporting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <InstitutionalSettings />
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalAdmin;
