import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, CreditCard } from 'lucide-react';
import { AdvisorDirectory } from '@/components/advisor/AdvisorDirectory';
import { MyCoachingSessions } from '@/components/advisor/MyCoachingSessions';
import { AdvisorProfile } from '@/components/advisor/AdvisorProfile';

const AdvisorMarketplace = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">Career Advisors</h1>
              <p className="text-muted-foreground">Professional coaching and guidance</p>
            </div>
          </div>

          <Tabs defaultValue="directory" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Find Advisors
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Sessions
              </TabsTrigger>
              <TabsTrigger value="become-advisor" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Become an Advisor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="directory" className="space-y-6 mt-6">
              <AdvisorDirectory />
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6 mt-6">
              <MyCoachingSessions />
            </TabsContent>

            <TabsContent value="become-advisor" className="space-y-6 mt-6">
              <AdvisorProfile />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdvisorMarketplace;
