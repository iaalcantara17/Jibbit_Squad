import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Mail, CheckCircle, XCircle } from "lucide-react";

interface CoverLetterPerformance {
  coverLetterId: string;
  template: string;
  sentCount: number;
  responseCount: number;
  interviewCount: number;
  offerCount: number;
}

interface CoverLetterPerformanceTrackerProps {
  coverLetters?: any[];
  jobs?: any[];
}

export const CoverLetterPerformanceTracker = ({ 
  coverLetters = [], 
  jobs = [] 
}: CoverLetterPerformanceTrackerProps) => {
  
  const calculatePerformance = (): CoverLetterPerformance[] => {
    const performanceMap = new Map<string, CoverLetterPerformance>();

    jobs.forEach((job: any) => {
      const coverLetterId = job.applicationMaterials?.coverLetterId;
      if (!coverLetterId) return;

      if (!performanceMap.has(coverLetterId)) {
        const coverLetter = coverLetters.find(cl => cl.id === coverLetterId);
        performanceMap.set(coverLetterId, {
          coverLetterId,
          template: coverLetter?.template || 'Unknown',
          sentCount: 0,
          responseCount: 0,
          interviewCount: 0,
          offerCount: 0
        });
      }

      const perf = performanceMap.get(coverLetterId)!;
      perf.sentCount++;

      if (['Phone Screen', 'Interview', 'Offer'].includes(job.status)) {
        perf.responseCount++;
      }
      if (['Interview', 'Offer'].includes(job.status)) {
        perf.interviewCount++;
      }
      if (job.status === 'Offer') {
        perf.offerCount++;
      }
    });

    return Array.from(performanceMap.values());
  };

  const performances = calculatePerformance();

  const getResponseRate = (perf: CoverLetterPerformance) => {
    return perf.sentCount > 0 ? (perf.responseCount / perf.sentCount) * 100 : 0;
  };

  const getEffectivenessRating = (rate: number) => {
    if (rate >= 50) return { label: 'Excellent', variant: 'default' as const };
    if (rate >= 30) return { label: 'Good', variant: 'secondary' as const };
    if (rate >= 15) return { label: 'Average', variant: 'outline' as const };
    return { label: 'Needs Work', variant: 'destructive' as const };
  };

  if (performances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cover Letter Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No cover letter performance data yet. Start applying to jobs to track effectiveness!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cover Letter Performance Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {performances.map((perf) => {
          const responseRate = getResponseRate(perf);
          const rating = getEffectivenessRating(responseRate);

          return (
            <div key={perf.coverLetterId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{perf.template} Template</h4>
                  <p className="text-sm text-muted-foreground">
                    {perf.sentCount} application{perf.sentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={rating.variant}>{rating.label}</Badge>
              </div>

              <Progress value={responseRate} className="h-2" />

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <Mail className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{perf.sentCount}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div>
                  <CheckCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{perf.responseCount}</p>
                  <p className="text-xs text-muted-foreground">Responses</p>
                </div>
                <div>
                  <CheckCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{perf.interviewCount}</p>
                  <p className="text-xs text-muted-foreground">Interviews</p>
                </div>
                <div>
                  <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold">{perf.offerCount}</p>
                  <p className="text-xs text-muted-foreground">Offers</p>
                </div>
              </div>

              <p className="text-sm">
                <strong>Response Rate:</strong> {responseRate.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
