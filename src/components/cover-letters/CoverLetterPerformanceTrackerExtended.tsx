import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceData {
  templateId: string;
  templateName: string;
  sent: number;
  response: number;
  interview: number;
  offer: number;
  rejected: number;
  responseRate: number;
}

export const CoverLetterPerformanceTrackerExtended = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all cover letters
      const { data: coverLetters, error: clError } = await supabase
        .from('cover_letters')
        .select('id, title')
        .eq('user_id', user.id);

      if (clError) throw clError;

      // Get analytics for each cover letter
      const { data: analytics, error: analyticsError } = await supabase
        .from('cover_letter_analytics')
        .select('*')
        .eq('user_id', user.id);

      if (analyticsError) throw analyticsError;

      // Aggregate data
      const aggregated: PerformanceData[] = (coverLetters || []).map(cl => {
        const clAnalytics = (analytics || []).filter(a => a.cover_letter_id === cl.id);
        
        const sent = clAnalytics.length;
        const response = clAnalytics.filter(a => a.outcome === 'response').length;
        const interview = clAnalytics.filter(a => a.outcome === 'interview').length;
        const offer = clAnalytics.filter(a => a.outcome === 'offer').length;
        const rejected = clAnalytics.filter(a => a.outcome === 'rejected').length;
        
        const successful = response + interview + offer;
        const responseRate = sent > 0 ? Math.round((successful / sent) * 100) : 0;

        return {
          templateId: cl.id,
          templateName: cl.title,
          sent,
          response,
          interview,
          offer,
          rejected,
          responseRate,
        };
      }).filter(d => d.sent > 0); // Only show templates with usage

      setPerformanceData(aggregated);

      // Set default comparison if we have data
      if (aggregated.length >= 2) {
        setCompareA(aggregated[0].templateId);
        setCompareB(aggregated[1].templateId);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDataById = (id: string): PerformanceData | undefined => {
    return performanceData.find(d => d.templateId === id);
  };

  const getComparisonIcon = (rateA: number, rateB: number) => {
    if (rateA > rateB) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rateA < rateB) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading performance data...</p>
        </CardContent>
      </Card>
    );
  }

  if (performanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No performance data yet. Start sending cover letters to track their effectiveness.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dataA = compareA ? getDataById(compareA) : undefined;
  const dataB = compareB ? getDataById(compareB) : undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cover Letter Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceData.map((data) => (
            <div key={data.templateId} className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{data.templateName}</h4>
                <Badge variant={data.responseRate >= 50 ? "default" : "secondary"}>
                  {data.responseRate}% response
                </Badge>
              </div>
              <Progress value={data.responseRate} className="h-2 mb-2" />
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-semibold">{data.sent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Responses</p>
                  <p className="font-semibold">{data.response}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interviews</p>
                  <p className="font-semibold">{data.interview}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Offers</p>
                  <p className="font-semibold">{data.offer}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {performanceData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>A/B Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Template A</Label>
                <Select value={compareA} onValueChange={setCompareA}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {performanceData.map(d => (
                      <SelectItem key={d.templateId} value={d.templateId}>
                        {d.templateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Template B</Label>
                <Select value={compareB} onValueChange={setCompareB}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {performanceData.map(d => (
                      <SelectItem key={d.templateId} value={d.templateId}>
                        {d.templateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dataA && dataB && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded-md p-4">
                  <h5 className="font-semibold mb-3">{dataA.templateName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Response Rate:</span>
                      <span className="font-semibold flex items-center gap-2">
                        {dataA.responseRate}%
                        {getComparisonIcon(dataA.responseRate, dataB.responseRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sent:</span>
                      <span className="font-semibold">{dataA.sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interviews:</span>
                      <span className="font-semibold">{dataA.interview}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offers:</span>
                      <span className="font-semibold">{dataA.offer}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h5 className="font-semibold mb-3">{dataB.templateName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Response Rate:</span>
                      <span className="font-semibold flex items-center gap-2">
                        {dataB.responseRate}%
                        {getComparisonIcon(dataB.responseRate, dataA.responseRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sent:</span>
                      <span className="font-semibold">{dataB.sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interviews:</span>
                      <span className="font-semibold">{dataB.interview}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offers:</span>
                      <span className="font-semibold">{dataB.offer}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
