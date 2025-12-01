import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InterviewSuccessScoreProps {
  interviewId: string;
  interviewDate: string | null;
}

interface ScoreFactors {
  checklistCompletion: number;
  checklistWeight: number;
  practiceCount: number;
  practiceWeight: number;
  mockSessionCount: number;
  mockWeight: number;
  daysUntilInterview: number;
  timeWeight: number;
  historicalSuccessRate: number;
  historyWeight: number;
}

interface Prediction {
  id: string;
  predicted_score: number;
  confidence_band: string;
  score_factors: ScoreFactors;
  top_actions: string[];
  created_at: string;
}

export const InterviewSuccessScore = ({ interviewId, interviewDate }: InterviewSuccessScoreProps) => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    fetchLatestPrediction();
  }, [interviewId]);

  const fetchLatestPrediction = async () => {
    const { data, error } = await supabase
      .from("interview_success_predictions")
      .select("*")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setPrediction(data as any);
    }
  };

  const calculateSuccessScore = async () => {
    setIsCalculating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch checklist completion
      const { data: checklists } = await supabase
        .from("interview_checklists")
        .select("*")
        .eq("interview_id", interviewId);

      const totalChecklist = checklists?.length || 0;
      const completedChecklist = checklists?.filter((c) => c.completed_at).length || 0;
      const checklistCompletion = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

      // Fetch practice responses
      const { data: practices } = await supabase
        .from("question_practice_responses")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "submitted");

      const practiceCount = practices?.length || 0;

      // Fetch mock sessions
      const { data: mockSessions } = await supabase
        .from("mock_interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const mockSessionCount = mockSessions?.length || 0;

      // Calculate days until interview
      const daysUntilInterview = interviewDate ? differenceInDays(new Date(interviewDate), new Date()) : 0;

      // Fetch historical success rate
      const { data: pastInterviews } = await supabase
        .from("interviews")
        .select("outcome")
        .eq("user_id", user.id)
        .neq("outcome", "pending")
        .not("outcome", "is", null);

      const totalPast = pastInterviews?.length || 0;
      const successfulPast = pastInterviews?.filter((i) => i.outcome === "offer").length || 0;
      const historicalSuccessRate = totalPast > 0 ? (successfulPast / totalPast) * 100 : 50; // Default 50% if no history

      // Define weights (total = 100)
      const weights = {
        checklist: 25,
        practice: 20,
        mock: 20,
        time: 15,
        history: 20,
      };

      // Calculate weighted scores
      const checklistScore = (checklistCompletion / 100) * weights.checklist;
      const practiceScore = Math.min((practiceCount / 10) * weights.practice, weights.practice); // Cap at 10 practices
      const mockScore = Math.min((mockSessionCount / 3) * weights.mock, weights.mock); // Cap at 3 mocks
      
      // Time score: optimal is 3-7 days before (100%), less than 1 day (50%), more than 14 days (70%)
      let timeScore = weights.time;
      if (daysUntilInterview < 1) {
        timeScore = weights.time * 0.5;
      } else if (daysUntilInterview <= 7) {
        timeScore = weights.time;
      } else if (daysUntilInterview <= 14) {
        timeScore = weights.time * 0.85;
      } else {
        timeScore = weights.time * 0.7;
      }

      const historyScore = (historicalSuccessRate / 100) * weights.history;

      const totalScore = Math.round(checklistScore + practiceScore + mockScore + timeScore + historyScore);

      // Determine confidence band
      let confidenceBand: "low" | "medium" | "high";
      if (totalPast < 3) {
        confidenceBand = "low";
      } else if (totalPast < 10) {
        confidenceBand = "medium";
      } else {
        confidenceBand = "high";
      }

      // Generate top 3 actions
      const actions: { score: number; action: string }[] = [];
      
      if (checklistCompletion < 80) {
        actions.push({ score: weights.checklist - checklistScore, action: `Complete interview checklist (${completedChecklist}/${totalChecklist} done)` });
      }
      
      if (practiceCount < 10) {
        actions.push({ score: weights.practice - practiceScore, action: `Practice more questions (${practiceCount}/10 recommended)` });
      }
      
      if (mockSessionCount < 3) {
        actions.push({ score: weights.mock - mockScore, action: `Complete mock interviews (${mockSessionCount}/3 recommended)` });
      }
      
      if (daysUntilInterview < 1) {
        actions.push({ score: weights.time * 0.5, action: "Schedule interview with more lead time for better preparation" });
      } else if (daysUntilInterview > 14) {
        actions.push({ score: weights.time * 0.3, action: "Keep practicing regularly as interview approaches" });
      }

      const topActions = actions
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((a) => a.action);

      const scoreFactors: ScoreFactors = {
        checklistCompletion,
        checklistWeight: weights.checklist,
        practiceCount,
        practiceWeight: weights.practice,
        mockSessionCount,
        mockWeight: weights.mock,
        daysUntilInterview,
        timeWeight: weights.time,
        historicalSuccessRate,
        historyWeight: weights.history,
      };

      // Save prediction
      const { data: newPrediction, error } = await supabase
        .from("interview_success_predictions")
        .insert({
          user_id: user.id,
          interview_id: interviewId,
          predicted_score: totalScore,
          confidence_band: confidenceBand,
          score_factors: scoreFactors as any,
          top_actions: topActions,
        })
        .select()
        .single();

      if (error) throw error;

      setPrediction(newPrediction as any);
      toast.success("Success score calculated");
    } catch (error) {
      console.error("Error calculating score:", error);
      toast.error("Failed to calculate success score");
    } finally {
      setIsCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Success Probability Score
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>How This Score Is Calculated</DialogTitle>
                <DialogDescription>
                  Transparent formula breakdown
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Score Components (Total: 100 points)</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span>• Interview Checklist Completion</span>
                      <span className="font-mono">25 points</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Question Practice Sessions (max 10)</span>
                      <span className="font-mono">20 points</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Mock Interview Sessions (max 3)</span>
                      <span className="font-mono">20 points</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Days Until Interview (optimal: 3-7)</span>
                      <span className="font-mono">15 points</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Historical Success Rate</span>
                      <span className="font-mono">20 points</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Confidence Band</p>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong>High:</strong> 10+ past interviews</li>
                    <li>• <strong>Medium:</strong> 3-9 past interviews</li>
                    <li>• <strong>Low:</strong> Less than 3 past interviews</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Time Scoring Logic</p>
                  <ul className="space-y-1 text-sm">
                    <li>• 3-7 days before: 100% of time score</li>
                    <li>• 1-3 or 7-14 days: 85% of time score</li>
                    <li>• Less than 1 day: 50% of time score</li>
                    <li>• More than 14 days: 70% of time score</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!prediction ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Get an AI-powered prediction of your interview success probability
            </p>
            <Button onClick={calculateSuccessScore} disabled={isCalculating}>
              {isCalculating ? "Calculating..." : "Calculate Success Score"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-5xl font-bold ${getScoreColor(prediction.predicted_score)}`}>
                  {prediction.predicted_score}
                </div>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
              <Badge className={getConfidenceColor(prediction.confidence_band)} variant="outline">
                {prediction.confidence_band} confidence
              </Badge>
            </div>

            <div className="space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Top Actions to Raise Your Score
              </p>
              {prediction.top_actions && prediction.top_actions.length > 0 ? (
                <ul className="space-y-2">
                  {prediction.top_actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-semibold">{idx + 1}.</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">You're well prepared!</p>
              )}
            </div>

            {prediction.score_factors && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <p className="font-semibold mb-2">Score Breakdown:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>Checklist: {(prediction.score_factors as any).checklistCompletion?.toFixed(0)}%</div>
                  <div>Practice: {(prediction.score_factors as any).practiceCount} sessions</div>
                  <div>Mocks: {(prediction.score_factors as any).mockSessionCount} completed</div>
                  <div>Days until: {(prediction.score_factors as any).daysUntilInterview}</div>
                  <div>History: {(prediction.score_factors as any).historicalSuccessRate?.toFixed(0)}% success</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={calculateSuccessScore} disabled={isCalculating} variant="outline" className="flex-1">
                {isCalculating ? "Recalculating..." : "Recalculate"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Last calculated: {new Date(prediction.created_at).toLocaleString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
