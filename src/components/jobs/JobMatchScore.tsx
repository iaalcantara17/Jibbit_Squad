import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JobMatchScoreProps {
  jobId: string;
}

interface MatchData {
  overallScore: number;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export const JobMatchScore = ({ jobId }: JobMatchScoreProps) => {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateMatch = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-job-match-score', {
        body: { jobId }
      });

      if (error) throw error;

      setMatchData(data);
      toast.success("Match score calculated");
    } catch (error: any) {
      console.error('Match calculation error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to calculate match score");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Good Match";
    if (score >= 50) return "Fair Match";
    return "Weak Match";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Job Match Analysis
          </CardTitle>
          <Button
            onClick={calculateMatch}
            disabled={isLoading}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? "Analyzing..." : matchData ? "Recalculate" : "Calculate Match"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {matchData ? (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Match Score</span>
                <span className={`text-3xl font-bold ${getScoreColor(matchData.overallScore)}`}>
                  {matchData.overallScore}%
                </span>
              </div>
              <Progress value={matchData.overallScore} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {getScoreLabel(matchData.overallScore)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-center">Skills</div>
                <Progress value={matchData.breakdown.skills} className="h-2" />
                <div className={`text-center font-bold ${getScoreColor(matchData.breakdown.skills)}`}>
                  {matchData.breakdown.skills}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-center">Experience</div>
                <Progress value={matchData.breakdown.experience} className="h-2" />
                <div className={`text-center font-bold ${getScoreColor(matchData.breakdown.experience)}`}>
                  {matchData.breakdown.experience}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-center">Education</div>
                <Progress value={matchData.breakdown.education} className="h-2" />
                <div className={`text-center font-bold ${getScoreColor(matchData.breakdown.education)}`}>
                  {matchData.breakdown.education}%
                </div>
              </div>
            </div>

            {matchData.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Your Strengths
                </h4>
                <div className="space-y-1">
                  {matchData.strengths.map((strength, index) => (
                    <div key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchData.gaps.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-600" />
                  Areas to Address
                </h4>
                <div className="space-y-1">
                  {matchData.gaps.map((gap, index) => (
                    <div key={index} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-600">⚠</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchData.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {matchData.recommendations.map((rec, index) => (
                    <Badge key={index} variant="secondary" className="block w-full text-left py-2">
                      {index + 1}. {rec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Calculate Match" to analyze how well you fit this role</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
