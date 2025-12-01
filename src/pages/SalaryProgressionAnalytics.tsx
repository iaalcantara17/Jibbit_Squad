import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Award, AlertCircle, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SalaryProgressionAnalytics() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    averageOffer: 0,
    highestOffer: 0,
    lowestOffer: 0,
    offersOverTime: [] as any[],
    negotiationOutcomes: {
      accepted: 0,
      declined: 0,
      negotiating: 0,
    },
    totalCompensation: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: offersData, error } = await supabase
        .from("offers")
        .select("*, jobs(company_name, job_title)")
        .eq("user_id", user.id);

      if (error) throw error;

      setOffers(offersData || []);
      calculateAnalytics(offersData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (offersData: any[]) => {
    if (offersData.length === 0) {
      setAnalytics({
        averageOffer: 0,
        highestOffer: 0,
        lowestOffer: 0,
        offersOverTime: [],
        negotiationOutcomes: { accepted: 0, declined: 0, negotiating: 0 },
        totalCompensation: [],
      });
      return;
    }

    // Basic Stats
    const salaries = offersData
      .filter((o) => o.base_salary)
      .map((o) => o.base_salary);

    const averageOffer = salaries.length > 0
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : 0;
    const highestOffer = salaries.length > 0 ? Math.max(...salaries) : 0;
    const lowestOffer = salaries.length > 0 ? Math.min(...salaries) : 0;

    // Offers Over Time
    const timeMap = new Map<string, { total: number; avg: number; count: number }>();
    offersData.forEach((offer) => {
      if (!offer.created_at || !offer.base_salary) return;
      const date = new Date(offer.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!timeMap.has(key)) {
        timeMap.set(key, { total: 0, avg: 0, count: 0 });
      }
      const stats = timeMap.get(key)!;
      stats.total += offer.base_salary;
      stats.count++;
      stats.avg = Math.round(stats.total / stats.count);
    });

    const offersOverTime = Array.from(timeMap.entries())
      .map(([month, stats]) => ({
        month,
        average: stats.avg,
        count: stats.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    // Negotiation Outcomes
    const negotiationOutcomes = {
      accepted: offersData.filter((o) => o.status === "accepted").length,
      declined: offersData.filter((o) => o.status === "declined").length,
      negotiating: offersData.filter((o) => o.status === "negotiating" || o.status === "pending").length,
    };

    // Total Compensation (base + bonus + equity estimate)
    const totalCompensation = offersData
      .filter((o) => o.base_salary)
      .map((offer) => {
        const base = offer.base_salary || 0;
        const bonus = offer.bonus || 0;
        // Equity is often a string like "10000 shares" or "2%", so we'll try to extract a number
        let equityValue = 0;
        if (offer.equity && typeof offer.equity === 'string') {
          const match = offer.equity.match(/\d+/);
          if (match) equityValue = parseInt(match[0], 10);
        }
        
        return {
          company: offer.jobs?.company_name || "Unknown",
          title: offer.jobs?.job_title || "Unknown",
          base,
          bonus,
          equity: equityValue,
          total: base + bonus + equityValue,
        };
      })
      .sort((a, b) => b.total - a.total);

    setAnalytics({
      averageOffer,
      highestOffer,
      lowestOffer,
      offersOverTime,
      negotiationOutcomes,
      totalCompensation,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Salary Progression Analytics</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this means:</strong> Track your compensation growth over time and negotiation outcomes.
            Understanding your market value helps in future negotiations.
          </AlertDescription>
        </Alert>

        {offers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Offer Data Yet</p>
              <p className="text-muted-foreground text-center">
                Track job offers to analyze salary progression and negotiation outcomes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Offer</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatSalary(analytics.averageOffer)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Base salary</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Highest Offer</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatSalary(analytics.highestOffer)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Top offer received</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{offers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Offers received</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="progression" className="space-y-6">
              <TabsList>
                <TabsTrigger value="progression">Progression Over Time</TabsTrigger>
                <TabsTrigger value="negotiation">Negotiation Outcomes</TabsTrigger>
                <TabsTrigger value="compensation">Total Compensation</TabsTrigger>
              </TabsList>

              <TabsContent value="progression" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Salary Progression Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.offersOverTime.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Not enough data to show progression. Receive more offers over time.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.offersOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatSalary(value)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Average Offer"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="negotiation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Negotiation Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">
                              {analytics.negotiationOutcomes.accepted}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Accepted</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-600">
                              {analytics.negotiationOutcomes.negotiating}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Negotiating</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-red-600">
                              {analytics.negotiationOutcomes.declined}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Declined</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert className="mt-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Negotiation Tip:</strong> Most successful candidates negotiate their offers.
                        Research market rates and be prepared to articulate your value.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compensation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Compensation Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.totalCompensation.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No compensation data available.</p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={analytics.totalCompensation.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="company" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => formatSalary(value)} />
                            <Legend />
                            <Bar dataKey="base" stackId="a" fill="#3b82f6" name="Base" />
                            <Bar dataKey="bonus" stackId="a" fill="#10b981" name="Bonus" />
                            <Bar dataKey="equity" stackId="a" fill="#f59e0b" name="Equity" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-6 space-y-3">
                          {analytics.totalCompensation.slice(0, 5).map((offer, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <p className="font-medium">{offer.company}</p>
                                <p className="text-sm text-muted-foreground">{offer.title}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="default">{formatSalary(offer.total)}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Base: {formatSalary(offer.base)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
