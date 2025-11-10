import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Clock, Target, HelpCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InterviewInsightsProps {
  jobId: string;
}

interface InterviewData {
  interviewProcess: Array<{
    stage: string;
    duration: string;
    focus: string;
  }>;
  commonQuestions: Array<{
    question: string;
    category: string;
    tips: string;
  }>;
  interviewFormat?: {
    style: string;
    numberOfRounds: number;
    interviewers: string;
  };
  preparationTips: string[];
  timeline?: {
    applicationToFirstInterview: string;
    totalProcessDuration: string;
    decisionTime: string;
  };
  successStrategies?: string[];
  questionsToAsk?: string[];
}

export const InterviewInsights = ({ jobId }: InterviewInsightsProps) => {
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInterviewPrep = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-interview-prep', {
        body: { jobId }
      });

      if (error) throw error;

      setInterviewData(data);
      toast.success("Interview insights generated");
    } catch (error: any) {
      console.error('Interview prep error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to generate interview insights");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'General': 'default',
      'Technical': 'secondary',
      'Behavioral': 'outline',
      'Situational': 'destructive'
    };
    return colors[category] || 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Interview Insights & Preparation
          </CardTitle>
          <Button
            onClick={getInterviewPrep}
            disabled={isLoading}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? "Generating..." : interviewData ? "Refresh" : "Get Insights"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {interviewData ? (
          <>
            {interviewData.interviewProcess.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Interview Process
                </h4>
                <div className="space-y-3">
                  {interviewData.interviewProcess.map((stage, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{stage.stage}</span>
                          <Badge variant="outline" className="text-xs">{stage.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{stage.focus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {interviewData.interviewFormat && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Interview Format</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Style:</span>
                    <span className="ml-2 font-medium">{interviewData.interviewFormat.style}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rounds:</span>
                    <span className="ml-2 font-medium">{interviewData.interviewFormat.numberOfRounds}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Interviewers:</span>
                    <span className="ml-2 font-medium">{interviewData.interviewFormat.interviewers}</span>
                  </div>
                </div>
              </div>
            )}

            {interviewData.commonQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Common Interview Questions
                </h4>
                <Accordion type="single" collapsible className="w-full">
                  {interviewData.commonQuestions.map((q, index) => (
                    <AccordionItem key={index} value={`question-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant={getCategoryColor(q.category) as any} className="text-xs">
                            {q.category}
                          </Badge>
                          <span className="text-sm">{q.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pl-4 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">💡 Tips:</p>
                          <p>{q.tips}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {interviewData.preparationTips.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Preparation Recommendations
                </h4>
                <ul className="space-y-2">
                  {interviewData.preparationTips.map((tip, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <span className="text-primary font-semibold mt-1">✓</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {interviewData.timeline && (
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold text-sm mb-3">Expected Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Application to First Interview:</span>
                    <span className="font-medium">{interviewData.timeline.applicationToFirstInterview}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Process Duration:</span>
                    <span className="font-medium">{interviewData.timeline.totalProcessDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decision Time:</span>
                    <span className="font-medium">{interviewData.timeline.decisionTime}</span>
                  </div>
                </div>
              </div>
            )}

            {interviewData.successStrategies && interviewData.successStrategies.length > 0 && (
              <div className="bg-accent/20 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">🎯 Success Strategies</h4>
                <ul className="space-y-1">
                  {interviewData.successStrategies.map((strategy, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <span className="text-primary">→</span>
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {interviewData.questionsToAsk && interviewData.questionsToAsk.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Questions You Should Ask</h4>
                <ul className="space-y-2">
                  {interviewData.questionsToAsk.map((question, index) => (
                    <li key={index} className="text-sm flex gap-2">
                      <span className="text-primary font-semibold">Q:</span>
                      <span className="text-muted-foreground">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Get Insights" to receive interview preparation guidance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
