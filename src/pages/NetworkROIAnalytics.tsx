import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, Award, AlertCircle, UserCheck, Handshake } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NetworkROIAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalReferrals: 0,
    interviewsFromNetwork: 0,
    offersFromNetwork: 0,
    relationshipTrends: [] as any[],
    referralStatus: [] as any[],
    topContacts: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [
        { data: referralsData, error: referralsError },
        { data: eventOutcomesData, error: outcomesError },
        { data: contactsData, error: contactsError },
        { data: interviewsData, error: interviewsError },
      ] = await Promise.all([
        supabase.from("referral_requests").select("*").eq("user_id", user.id),
        supabase.from("event_outcomes").select("*, jobs(status)").eq("user_id", user.id),
        supabase.from("contacts").select("*").eq("user_id", user.id),
        supabase.from("interviews").select("*, jobs(id)").eq("user_id", user.id),
      ]);

      if (referralsError) throw referralsError;
      if (outcomesError) throw outcomesError;
      if (contactsError) throw contactsError;
      if (interviewsError) throw interviewsError;

      calculateAnalytics(
        referralsData || [],
        eventOutcomesData || [],
        contactsData || [],
        interviewsData || []
      );
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    referrals: any[],
    outcomes: any[],
    contacts: any[],
    interviews: any[]
  ) => {
    // Total Referrals
    const totalReferrals = referrals.length;

    // Interviews from Network (via referrals or event outcomes)
    const referralJobIds = new Set(referrals.map((r) => r.job_id).filter(Boolean));
    const outcomeJobIds = new Set(outcomes.map((o) => o.job_id).filter(Boolean));
    const networkJobIds = new Set([...referralJobIds, ...outcomeJobIds]);
    
    const interviewsFromNetwork = interviews.filter((i) => 
      i.jobs?.id && networkJobIds.has(i.jobs.id)
    ).length;

    // Offers from Network
    const offersFromNetwork = outcomes.filter(
      (o) => o.outcome_type === "job_offer" || o.jobs?.status === "offer"
    ).length;

    // Referral Status Distribution
    const statusMap = new Map<string, number>();
    referrals.forEach((r) => {
      const status = r.status || "pending";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const referralStatus = Array.from(statusMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Relationship Strength Trends
    const strengthMap = new Map<number, number>();
    contacts.forEach((c) => {
      const strength = c.relationship_strength || 3;
      strengthMap.set(strength, (strengthMap.get(strength) || 0) + 1);
    });

    const relationshipTrends = Array.from(strengthMap.entries())
      .map(([strength, count]) => ({
        strength: `Level ${strength}`,
        count,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.strength.replace("Level ", ""));
        const bNum = parseInt(b.strength.replace("Level ", ""));
        return aNum - bNum;
      });

    // Top Contacts (by interaction count)
    const contactInteractions = new Map<string, number>();
    outcomes.forEach((o) => {
      if (o.contact_id) {
        contactInteractions.set(o.contact_id, (contactInteractions.get(o.contact_id) || 0) + 1);
      }
    });

    const topContacts = Array.from(contactInteractions.entries())
      .map(([contactId, interactions]) => {
        const contact = contacts.find((c) => c.id === contactId);
        return {
          name: contact?.name || "Unknown",
          company: contact?.company,
          interactions,
          strength: contact?.relationship_strength || 3,
        };
      })
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 5);

    setAnalytics({
      totalReferrals,
      interviewsFromNetwork,
      offersFromNetwork,
      relationshipTrends,
      referralStatus,
      topContacts,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Network ROI Analytics</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this means:</strong> Your network is a powerful job search asset. Track referrals,
            interviews sourced through connections, and relationship strength over time to maximize ROI.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Referrals Requested</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalReferrals}</div>
              <p className="text-xs text-muted-foreground mt-1">Total requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Interviews from Network</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.interviewsFromNetwork}</div>
              <p className="text-xs text-muted-foreground mt-1">Via connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Offers from Network</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.offersFromNetwork}</div>
              <p className="text-xs text-muted-foreground mt-1">Network success</p>
            </CardContent>
          </Card>
        </div>

        {analytics.totalReferrals === 0 && analytics.interviewsFromNetwork === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Network Activity Yet</p>
              <p className="text-muted-foreground text-center">
                Start requesting referrals and tracking network outcomes to see ROI analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="referrals" className="space-y-6">
            <TabsList>
              <TabsTrigger value="referrals">Referral Status</TabsTrigger>
              <TabsTrigger value="relationships">Relationship Strength</TabsTrigger>
              <TabsTrigger value="top">Top Connections</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Request Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.referralStatus.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No referral data available.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.referralStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.referralStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-6 space-y-2">
                        {analytics.referralStatus.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="capitalize">{item.name}</span>
                            </div>
                            <Badge>{item.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="relationships" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Relationship Strength Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.relationshipTrends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No relationship data available.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.relationshipTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="strength" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Contacts" />
                        </BarChart>
                      </ResponsiveContainer>
                      <Alert className="mt-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Tip:</strong> Stronger relationships (Level 4-5) tend to yield better referral outcomes.
                          Consider nurturing connections to strengthen relationships over time.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Network Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topContacts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No interaction data available. Track event outcomes to see top contributors.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.topContacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              {contact.company && (
                                <p className="text-sm text-muted-foreground">{contact.company}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{contact.interactions} outcomes</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Strength: Level {contact.strength}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
