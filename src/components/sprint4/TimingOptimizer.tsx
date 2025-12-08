import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Send, 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addHours, setHours, setMinutes, nextDay } from 'date-fns';

interface TimingOptimizerProps {
  jobId: string;
  companyName?: string;
  industry?: string;
  timezone?: string;
  onSchedule?: (scheduledTime: Date) => void;
}

interface TimingData {
  recommended_day: string;
  recommended_time_start: string;
  recommended_time_end: string;
  timing_score: number;
  recommendation_text: string;
  factors: string[];
  submit_now: boolean;
  next_optimal_time: string;
}

export const TimingOptimizer = ({ 
  jobId, 
  companyName, 
  industry,
  timezone = 'America/New_York',
  onSchedule 
}: TimingOptimizerProps) => {
  const [timing, setTiming] = useState<TimingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const fetchTiming = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('timing-optimizer', {
        body: { jobId, companyName, industry, timezone }
      });

      if (fnError) throw fnError;
      if (data?.timing) {
        setTiming(data.timing);
      }
    } catch (err) {
      console.error('Failed to fetch timing recommendation:', err);
      setError('Unable to optimize timing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiming();
  }, [jobId, companyName, industry]);

  const handleScheduleSubmission = async () => {
    if (!timing?.next_optimal_time) return;
    
    setScheduling(true);
    try {
      const scheduledTime = new Date(timing.next_optimal_time);
      
      // Save scheduled submission to database
      const { error } = await supabase
        .from('application_timing_recommendations')
        .upsert({
          job_id: jobId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          is_scheduled: true,
          scheduled_submit_at: scheduledTime.toISOString(),
          recommended_day: timing.recommended_day,
          recommended_time_start: timing.recommended_time_start,
          timing_score: timing.timing_score,
          recommendation_text: timing.recommendation_text
        }, { onConflict: 'job_id' });

      if (error) throw error;

      onSchedule?.(scheduledTime);
    } catch (err) {
      console.error('Failed to schedule submission:', err);
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !timing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Unable to calculate optimal timing'}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchTiming}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Calculate Timing
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
          Timing Optimizer
        </CardTitle>
        <CardDescription>
          Best time to submit your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Recommendation */}
        <div className={`text-center p-4 rounded-lg ${timing.submit_now ? 'bg-success/10' : 'bg-warning/10'}`}>
          {timing.submit_now ? (
            <>
              <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="font-bold text-lg text-success">Submit Now!</p>
              <p className="text-sm text-muted-foreground">
                Current timing is optimal for this application
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-8 w-8 mx-auto text-warning mb-2" />
              <p className="font-bold text-lg text-warning">Wait for Better Timing</p>
              <p className="text-sm text-muted-foreground">
                Consider scheduling your submission
              </p>
            </>
          )}
        </div>

        {/* Timing Score */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm">Current Timing Score</span>
          <Badge variant={timing.timing_score >= 70 ? 'default' : 'secondary'}>
            {timing.timing_score}/100
          </Badge>
        </div>

        {/* Optimal Time Window */}
        <div className="p-3 border rounded-lg space-y-2">
          <p className="text-sm font-medium">Optimal Submission Window</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {timing.recommended_day}, {timing.recommended_time_start} - {timing.recommended_time_end}
            </span>
          </div>
        </div>

        {/* Next Optimal Time */}
        {timing.next_optimal_time && !timing.submit_now && (
          <div className="p-3 bg-primary/5 rounded-lg space-y-2">
            <p className="text-sm font-medium">Next Optimal Time</p>
            <p className="text-lg font-semibold text-primary">
              {format(new Date(timing.next_optimal_time), 'EEEE, MMM d \'at\' h:mm a')}
            </p>
            <Button 
              className="w-full mt-2" 
              onClick={handleScheduleSubmission}
              disabled={scheduling}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {scheduling ? 'Scheduling...' : 'Schedule Submission'}
            </Button>
          </div>
        )}

        {/* Recommendation Text */}
        <p className="text-sm text-muted-foreground">
          {timing.recommendation_text}
        </p>

        {/* Factors */}
        {timing.factors && timing.factors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Based on:</p>
            <div className="flex flex-wrap gap-1">
              {timing.factors.map((factor, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Submit Now Button */}
        {timing.submit_now && (
          <Button className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Submit Application Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
