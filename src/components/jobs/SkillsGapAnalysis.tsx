import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SkillsGapAnalysisProps {
  jobId: string;
}

interface GapData {
  missingSkills: Array<{
    skill: string;
    priority: string;
    reason: string;
  }>;
  skillsToImprove: Array<{
    skill: string;
    current: string;
    target: string;
    priority: string;
  }>;
  learningPath: Array<{
    step: number;
    skill: string;
    resource: string;
    duration: string;
  }>;
  alternativeSkills: Array<{
    instead: string;
    alternative: string;
    reasoning: string;
  }>;
}

export const SkillsGapAnalysis = ({ jobId }: SkillsGapAnalysisProps) => {
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeGaps = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-skills-gap', {
        body: { jobId }
      });

      if (error) throw error;

      setGapData(data);
      toast.success("Skills gap analysis complete");
    } catch (error: any) {
      console.error('Skills gap analysis error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to analyze skills gap");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Skills Gap Analysis
          </CardTitle>
          <Button
            onClick={analyzeGaps}
            disabled={isLoading}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? "Analyzing..." : gapData ? "Refresh Analysis" : "Analyze Gaps"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {gapData ? (
          <>
            {gapData.missingSkills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Missing Critical Skills
                </h4>
                <div className="space-y-2">
                  {gapData.missingSkills.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.skill}</span>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gapData.skillsToImprove.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Skills to Improve
                </h4>
                <div className="space-y-2">
                  {gapData.skillsToImprove.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.skill}</span>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{item.current}</Badge>
                        <span>→</span>
                        <Badge variant="secondary">{item.target}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gapData.learningPath.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recommended Learning Path
                </h4>
                <div className="space-y-3">
                  {gapData.learningPath.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {step.step}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="font-medium">{step.skill}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {step.resource}
                        </div>
                        <Badge variant="outline" className="mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.duration}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gapData.alternativeSkills.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-sm">💡 Alternative Skills</h4>
                <div className="space-y-2">
                  {gapData.alternativeSkills.map((alt, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{alt.alternative}</span> instead of{' '}
                      <span className="font-medium">{alt.instead}</span>
                      <p className="text-muted-foreground mt-1">{alt.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Analyze Gaps" to identify skills you need to develop</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
