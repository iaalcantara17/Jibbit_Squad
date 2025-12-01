import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bell, Target, Star, Zap } from 'lucide-react';
import { InformationalInterviewsManager } from '@/components/network/InformationalInterviewsManager';
import { RelationshipMaintenance } from '@/components/network/RelationshipMaintenance';
import { ReferencesManager } from '@/components/network/ReferencesManager';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NetworkPowerFeatures = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold">Network Power Features</h1>
                <p className="text-muted-foreground">Advanced tools to maximize your professional network</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/networking-campaigns')}>
              <Target className="h-4 w-4 mr-2" />
              View Campaigns
            </Button>
          </div>

          <Tabs defaultValue="interviews" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interviews" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Informational Interviews
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Relationship Maintenance
              </TabsTrigger>
              <TabsTrigger value="references" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                References
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interviews" className="space-y-6 mt-6">
              <InformationalInterviewsManager />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6 mt-6">
              <RelationshipMaintenance />
            </TabsContent>

            <TabsContent value="references" className="space-y-6 mt-6">
              <ReferencesManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NetworkPowerFeatures;