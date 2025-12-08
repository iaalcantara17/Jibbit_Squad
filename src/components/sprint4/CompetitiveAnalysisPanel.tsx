import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompetitiveAnalysisPanelProps {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
}

interface CompetitiveData {
  competitive_score: number;
  estimated_applicants: number;
  likelihood_percent: number;
  likelihood_interview: string;
  market_position: string;
  advantages: string[];
  disadvantages: string[];
  differentiation_strategies: string[];
}

export const CompetitiveAnalysisPanel = ({ jobId, jobTitle, jobDescription }: CompetitiveAnalysisPanelProps) => {
  const [data, setData] = useState<CompetitiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('competitive-analysis', {
        body: { jobId, jobTitle, jobDescription }
      });

      if (fnError) throw fnError;
      if (result?.analysis) {
        setData(result.analysis);
      }
    } catch (err) {
      console.error('Failed to fetch competitive analysis:', err);
      setError('Unable to analyze competition at this time');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchAnalysis();
    }
  }, [jobId]);

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood?.toLowerCase()) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'No analysis available'}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchAnalysis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Analyze Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Competitive Analysis
        </CardTitle>
        <CardDescription>
          Your competitive position for this role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Competitive Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Competitive Score</span>
            <span className="text-lg font-bold">{data.competitive_score}/100</span>
          </div>
          <Progress value={data.competitive_score} className="h-2" />
        </div>

        {/* Interview Likelihood */}
        <div className="p-4 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Interview Likelihood</p>
          <p className={`text-2xl font-bold ${getLikelihoodColor(data.likelihood_interview)}`}>
            {data.likelihood_interview}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.likelihood_percent}% chance based on your profile
          </p>
        </div>

        {/* Estimated Competition */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm">Estimated Applicants</span>
          <Badge variant="secondary">{data.estimated_applicants?.toLocaleString() || 'Unknown'}</Badge>
        </div>

        {/* Advantages */}
        {data.advantages && data.advantages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Your Advantages</span>
            </div>
            <ul className="space-y-1">
              {data.advantages.slice(0, 3).map((adv, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <TrendingUp className="h-3 w-3 mt-1 text-success flex-shrink-0" />
                  {adv}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disadvantages */}
        {data.disadvantages && data.disadvantages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-warning">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Areas to Address</span>
            </div>
            <ul className="space-y-1">
              {data.disadvantages.slice(0, 3).map((dis, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <TrendingDown className="h-3 w-3 mt-1 text-warning flex-shrink-0" />
                  {dis}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Differentiation Strategies */}
        {data.differentiation_strategies && data.differentiation_strategies.length > 0 && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">How to Stand Out</span>
            </div>
            <ul className="space-y-1">
              {data.differentiation_strategies.slice(0, 3).map((strat, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  {idx + 1}. {strat}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={fetchAnalysis}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </CardContent>
    </Card>
  );
};
