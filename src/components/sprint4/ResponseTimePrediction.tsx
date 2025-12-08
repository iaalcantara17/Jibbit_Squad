import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, AlertCircle, RefreshCw, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, differenceInDays, isPast } from 'date-fns';

interface ResponseTimePredictionProps {
  jobId: string;
  companyName: string;
  appliedDate?: string;
  industry?: string;
}

interface PredictionData {
  predicted_days_min: number;
  predicted_days_max: number;
  predicted_days_avg: number;
  confidence: number;
  industry_benchmark: number;
  suggested_followup_date: string;
  factors: string[];
}

export const ResponseTimePrediction = ({ 
  jobId, 
  companyName, 
  appliedDate, 
  industry 
}: ResponseTimePredictionProps) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('response-time-prediction', {
        body: { 
          jobId, 
          companyName, 
          appliedDate: appliedDate || new Date().toISOString(),
          industry 
        }
      });

      if (fnError) throw fnError;
      if (data?.prediction) {
        setPrediction(data.prediction);
      }
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
      setError('Unable to predict response time');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [jobId, companyName]);

  const getOverdueStatus = () => {
    if (!appliedDate || !prediction) return null;
    
    const applied = new Date(appliedDate);
    const expectedMax = addDays(applied, prediction.predicted_days_max);
    const daysOverdue = differenceInDays(new Date(), expectedMax);
    
    if (daysOverdue > 0) {
      return { overdue: true, days: daysOverdue };
    }
    return { overdue: false, days: 0 };
  };

  const overdueStatus = getOverdueStatus();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Response Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Response Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'No prediction available'}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchPrediction}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Predict Response Time
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Response Timeline
        </CardTitle>
        <CardDescription>
          When to expect a response from {companyName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expected Response Window */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Typically responds in</p>
          <p className="text-2xl font-bold">
            {prediction.predicted_days_min}-{prediction.predicted_days_max} days
          </p>
          <Badge variant="outline" className="mt-2">
            {prediction.confidence}% confidence
          </Badge>
        </div>

        {/* Overdue Alert */}
        {overdueStatus?.overdue && (
          <Alert className="border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              Response is {overdueStatus.days} days overdue. Consider following up.
            </AlertDescription>
          </Alert>
        )}

        {/* Suggested Follow-up */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Suggested Follow-up</p>
              <p className="text-xs text-muted-foreground">
                {prediction.suggested_followup_date 
                  ? format(new Date(prediction.suggested_followup_date), 'MMM d, yyyy')
                  : 'Calculate based on application date'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-1" />
            Remind Me
          </Button>
        </div>

        {/* Industry Benchmark */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <span className="text-sm text-muted-foreground">Industry Average</span>
          <span className="font-medium">{prediction.industry_benchmark} days</span>
        </div>

        {/* Factors */}
        {prediction.factors && prediction.factors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Prediction based on:</p>
            <div className="flex flex-wrap gap-1">
              {prediction.factors.map((factor, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
