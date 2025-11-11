import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationRuleBuilder } from "@/components/automation/AutomationRuleBuilder";
import { AutomationExecutionLogs } from "@/components/automation/AutomationExecutionLogs";

const Automation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">Application Automation</h1>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules">Automation Rules</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <AutomationRuleBuilder />
          </TabsContent>

          <TabsContent value="logs">
            <AutomationExecutionLogs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Automation;
