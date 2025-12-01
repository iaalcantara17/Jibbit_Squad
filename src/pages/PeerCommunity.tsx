import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Calendar, Share2 } from 'lucide-react';
import { SupportGroupsList } from '@/components/peer/SupportGroupsList';
import { GroupChallenges } from '@/components/peer/GroupChallenges';
import { GroupWebinars } from '@/components/peer/GroupWebinars';
import { PeerReferrals } from '@/components/peer/PeerReferrals';

const PeerCommunity = () => {
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
              <h1 className="text-4xl font-display font-bold">Peer Community</h1>
              <p className="text-muted-foreground">Connect, share, and grow with your job search peers</p>
            </div>
          </div>

          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Support Groups
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="webinars" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Webinars
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Peer Referrals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="space-y-6 mt-6">
              <SupportGroupsList />
            </TabsContent>

            <TabsContent value="challenges" className="space-y-6 mt-6">
              <GroupChallenges />
            </TabsContent>

            <TabsContent value="webinars" className="space-y-6 mt-6">
              <GroupWebinars />
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6 mt-6">
              <PeerReferrals />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PeerCommunity;
