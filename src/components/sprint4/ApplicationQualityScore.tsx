import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationQualityScoreProps {
  jobId: string;
  resumeId?: string;
  coverLetterId?: string;
  jobDescription?: string;
  minimumScore?: number;
  onScoreChange?: (score: number) => void;
}

interface QualityData {
  overall_score: number;
  keyword_match_score: number;
  experience_alignment_score: number;
  formatting_score: number;
  consistency_score: number;
  missing_keywords: string[];
  strengths: string[];
  improvement_suggestions: string[];
}

export const ApplicationQualityScore = ({ 
  jobId, 
  resumeId, 
  coverLetterId, 
  jobDescription,
  minimumScore = 70,
  onScoreChange
}: ApplicationQualityScoreProps) => {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('application-quality-score', {
        body: { jobId, resumeId, coverLetterId, jobDescription }
      });

      if (fnError) throw fnError;
      if (result?.assessment) {
        setData(result.assessment);
        onScoreChange?.(result.assessment.overall_score);
      }
    } catch (err) {
      console.error('Failed to fetch quality score:', err);
      setError('Unable to assess application quality');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, [jobId, resumeId, coverLetterId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Work';
    return 'Poor';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Application Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
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
            <FileCheck className="h-5 w-5" />
            Application Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Unable to score application'}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchScore}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Analyze Application
          </Button>
        </CardContent>
      </Card>
    );
  }

  const meetsMinimum = data.overall_score >= minimumScore;

  return (
    <Card className={!meetsMinimum ? 'border-warning' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Application Quality
        </CardTitle>
        <CardDescription>
          AI-powered assessment of your application materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Overall Quality Score</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(data.overall_score)}`}>
              {data.overall_score}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <Badge 
            variant={meetsMinimum ? 'default' : 'secondary'} 
            className="mt-2"
          >
            {getScoreLabel(data.overall_score)}
          </Badge>
        </div>

        {/* Minimum Score Warning */}
        {!meetsMinimum && (
          <Alert className="border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Below Recommended Threshold</AlertTitle>
            <AlertDescription>
              Your score is below the recommended minimum of {minimumScore}. 
              Improve your application before submitting.
            </AlertDescription>
          </Alert>
        )}

        {/* Score Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Score Breakdown</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Keyword Match</span>
              <span className="font-medium">{data.keyword_match_score}%</span>
            </div>
            <Progress value={data.keyword_match_score} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Experience Alignment</span>
              <span className="font-medium">{data.experience_alignment_score}%</span>
            </div>
            <Progress value={data.experience_alignment_score} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Formatting</span>
              <span className="font-medium">{data.formatting_score}%</span>
            </div>
            <Progress value={data.formatting_score} className="h-1.5" />
          </div>

          {data.consistency_score !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Consistency</span>
                <span className="font-medium">{data.consistency_score}%</span>
              </div>
              <Progress value={data.consistency_score} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Strengths */}
        {data.strengths && data.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Strengths</span>
            </div>
            <ul className="space-y-1">
              {data.strengths.slice(0, 3).map((str, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Sparkles className="h-3 w-3 mt-1 text-success flex-shrink-0" />
                  {str}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Keywords */}
        {data.missing_keywords && data.missing_keywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-warning">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Missing Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.missing_keywords.slice(0, 8).map((kw, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {data.improvement_suggestions && data.improvement_suggestions.length > 0 && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm font-medium flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Top Improvements
            </p>
            <ol className="space-y-1 list-decimal list-inside">
              {data.improvement_suggestions.slice(0, 3).map((sug, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  {sug}
                </li>
              ))}
            </ol>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={fetchScore}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-analyze
        </Button>
      </CardContent>
    </Card>
  );
};
