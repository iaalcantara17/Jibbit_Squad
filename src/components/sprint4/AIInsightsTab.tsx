import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Clock, Target, BarChart3, Sparkles, DollarSign } from 'lucide-react';
import { ApplicationQualityScore } from './ApplicationQualityScore';
import { CompetitiveAnalysisPanel } from './CompetitiveAnalysisPanel';
import { ResponseTimePrediction } from './ResponseTimePrediction';
import { TimingOptimizer } from './TimingOptimizer';
import { FollowUpReminders } from './FollowUpReminders';
import { SalaryBenchmarkPanel } from './SalaryBenchmarkPanel';

interface AIInsightsTabProps {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  companyName: string;
  appliedDate?: string;
  applicationStatus?: string;
  industry?: string;
  location?: string;
  resumeId?: string;
  coverLetterId?: string;
}

export const AIInsightsTab = ({
  jobId,
  jobTitle,
  jobDescription,
  companyName,
  appliedDate,
  applicationStatus = 'Applied',
  industry,
  location,
  resumeId,
  coverLetterId
}: AIInsightsTabProps) => {
  const [activeInsight, setActiveInsight] = useState('quality');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">AI-Powered Insights</h3>
        <Badge variant="secondary" className="ml-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Sprint 4
        </Badge>
      </div>

      <Tabs value={activeInsight} onValueChange={setActiveInsight} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="quality" className="flex flex-col items-center gap-1 py-2">
            <Target className="h-4 w-4" />
            <span className="text-xs">Quality</span>
          </TabsTrigger>
          <TabsTrigger value="competitive" className="flex flex-col items-center gap-1 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Compete</span>
          </TabsTrigger>
          <TabsTrigger value="response" className="flex flex-col items-center gap-1 py-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Response</span>
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex flex-col items-center gap-1 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Timing</span>
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex flex-col items-center gap-1 py-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Follow-up</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex flex-col items-center gap-1 py-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Salary</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quality" className="mt-4">
          <ApplicationQualityScore
            jobId={jobId}
            resumeId={resumeId}
            coverLetterId={coverLetterId}
            jobDescription={jobDescription}
            minimumScore={70}
            onScoreChange={(score) => console.log('Quality score:', score)}
          />
        </TabsContent>

        <TabsContent value="competitive" className="mt-4">
          <CompetitiveAnalysisPanel
            jobId={jobId}
            jobTitle={jobTitle}
            jobDescription={jobDescription}
          />
        </TabsContent>

        <TabsContent value="response" className="mt-4">
          <ResponseTimePrediction
            jobId={jobId}
            companyName={companyName}
            appliedDate={appliedDate}
            industry={industry}
          />
        </TabsContent>

        <TabsContent value="timing" className="mt-4">
          <TimingOptimizer
            jobId={jobId}
            companyName={companyName}
            industry={industry}
          />
        </TabsContent>

        <TabsContent value="followup" className="mt-4">
          <FollowUpReminders 
            jobId={jobId} 
            jobTitle={jobTitle}
            companyName={companyName}
            applicationStatus={applicationStatus}
            appliedDate={appliedDate}
          />
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalaryBenchmarkPanel
            jobTitle={jobTitle}
            location={location || 'United States'}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Analysis Summary</CardTitle>
          <CardDescription>Key insights at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">UC-122</div>
              <div className="text-xs text-muted-foreground">Quality Score</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">UC-123</div>
              <div className="text-xs text-muted-foreground">Competition</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">UC-121</div>
              <div className="text-xs text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">UC-124</div>
              <div className="text-xs text-muted-foreground">Timing</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
