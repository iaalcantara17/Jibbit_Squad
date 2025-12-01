import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Target, AlertCircle, Calendar, Award, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateApplicationsSent,
  calculateInterviewsScheduled,
  calculateOffersReceived,
  calculateConversionRates,
} from "@/lib/analyticsService";

export default function Forecasting() {
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [currentPipeline, setCurrentPipeline] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [
        { data: forecastsData },
        { data: jobsData },
        { data: historyData },
        { data: interviewsData },
      ] = await Promise.all([
        supabase.from("forecasts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").eq("user_id", user.id).eq("is_archived", false),
        supabase.from("application_status_history").select("*").eq("user_id", user.id),
        supabase.from("interviews").select("*").eq("user_id", user.id),
      ]);

      setForecasts(forecastsData || []);

      // Calculate current pipeline
      const applied = calculateApplicationsSent(jobsData || []);
      const interviews = calculateInterviewsScheduled(interviewsData || []);
      const offers = calculateOffersReceived(jobsData || []);
      const rates = calculateConversionRates(jobsData || []);

      setCurrentPipeline({
        applied,
        interviews,
        offers,
        rates,
        totalJobs: jobsData?.length || 0,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load forecasting data");
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate predictions based on historical rates
      const { rates, applied } = currentPipeline;

      // Predict interviews in next 30 days
      const expectedInterviews = Math.round((applied * rates.appliedToInterview) / 100);
      const expectedOffers = Math.round((expectedInterviews * rates.interviewToOffer) / 100);

      // Confidence based on data volume
      const getConfidence = (count: number) => {
        if (count < 5) return "low";
        if (count < 15) return "medium";
        return "high";
      };

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);

      const predictions = [
        {
          forecast_type: "interviews",
          prediction_value: expectedInterviews,
          confidence_level: getConfidence(applied),
          based_on_data: {
            applications: applied,
            historical_rate: rates.appliedToInterview,
          },
          target_date: targetDate.toISOString().split("T")[0],
        },
        {
          forecast_type: "offers",
          prediction_value: expectedOffers,
          confidence_level: getConfidence(currentPipeline.interviews),
          based_on_data: {
            interviews: currentPipeline.interviews,
            historical_rate: rates.interviewToOffer,
          },
          target_date: targetDate.toISOString().split("T")[0],
        },
      ];

      for (const pred of predictions) {
        const { error } = await supabase.from("forecasts").insert([
          {
            user_id: user.id,
            ...pred,
          },
        ]);
        if (error) throw error;
      }

      toast.success("Forecast generated!");
      loadData();
    } catch (error) {
      console.error("Failed to generate forecast:", error);
      toast.error("Failed to generate forecast");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const activeForecast = forecasts.filter((f) => !f.actual_value && new Date(f.target_date) >= new Date());
  const pastForecasts = forecasts.filter((f) => new Date(f.target_date) < new Date());

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Forecasting & Predictions</h1>
          <Button onClick={generateForecast} disabled={currentPipeline.applied < 3}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Forecast
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Honest forecasting:</strong> Predictions are based solely on your historical data and current pipeline.
            Confidence levels reflect data volume, not false precision. More applications = better predictions.
          </AlertDescription>
        </Alert>

        {/* Current Pipeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">{currentPipeline.applied}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interviews</p>
                <p className="text-2xl font-bold">{currentPipeline.interviews}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offers</p>
                <p className="text-2xl font-bold">{currentPipeline.offers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conv. Rate</p>
                <p className="text-2xl font-bold">{currentPipeline.rates?.appliedToOffer || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentPipeline.applied < 3 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Need at least 3 applications to generate forecasts. Keep applying to build prediction data!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Forecasts</TabsTrigger>
            <TabsTrigger value="past">Past Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeForecast.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Active Forecasts</p>
                  <p className="text-muted-foreground text-center mb-4">
                    Generate a forecast to predict upcoming interviews and offers
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeForecast.map((forecast) => (
                  <Card key={forecast.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">
                          {forecast.forecast_type.replace("_", " ")}
                        </CardTitle>
                        <Badge
                          variant={
                            forecast.confidence_level === "high"
                              ? "default"
                              : forecast.confidence_level === "medium"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {forecast.confidence_level} confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Prediction</p>
                          <p className="text-2xl font-bold">{forecast.prediction_value}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          By {new Date(forecast.target_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground border-t pt-3">
                        <p>Based on:</p>
                        <ul className="list-disc list-inside mt-1">
                          {Object.entries(forecast.based_on_data).map(([key, value]) => (
                            <li key={key}>
                              {key.replace(/_/g, " ")}: {String(value)}
                              {key.includes("rate") ? "%" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Prediction Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                {pastForecasts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No past forecasts yet. Predictions will appear here after their target date passes.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pastForecasts.map((forecast) => (
                      <div key={forecast.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium capitalize">{forecast.forecast_type.replace("_", " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {new Date(forecast.target_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            Predicted: <span className="font-medium">{forecast.prediction_value}</span>
                          </p>
                          {forecast.actual_value !== null ? (
                            <>
                              <p className="text-sm">
                                Actual: <span className="font-medium">{forecast.actual_value}</span>
                              </p>
                              {forecast.accuracy_score && (
                                <Badge
                                  variant={forecast.accuracy_score > 80 ? "default" : "secondary"}
                                  className="mt-1"
                                >
                                  {forecast.accuracy_score}% accurate
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="mt-1">
                              Awaiting data
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
