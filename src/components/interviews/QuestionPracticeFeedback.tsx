import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Lightbulb,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  question_text: string;
  category: string;
}

interface WeakLanguage {
  phrase: string;
  alternative: string;
  reason: string;
}

interface StarAdherence {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  feedback: string;
}

interface Feedback {
  relevance_score: number;
  specificity_score: number;
  impact_score: number;
  clarity_score: number;
  overall_score: number;
  star_adherence: StarAdherence | null;
  weak_language: WeakLanguage[];
  speaking_time_estimate: number;
  alternative_approaches: string[];
  general_feedback: string;
}

interface Response {
  response_text: string;
  time_taken: number;
  timer_duration: number | null;
}

interface QuestionPracticeFeedbackProps {
  responseId: string;
  question: Question;
  onBack: () => void;
}

export const QuestionPracticeFeedback = ({ responseId, question, onBack }: QuestionPracticeFeedbackProps) => {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<Response | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    loadFeedback();
  }, [responseId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      
      // Get response
      const { data: responseData, error: responseError } = await supabase
        .from('question_practice_responses')
        .select('*')
        .eq('id', responseId)
        .single();

      if (responseError) throw responseError;
      setResponse(responseData);

      // Get feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('question_practice_feedback')
        .select('*')
        .eq('response_id', responseId)
        .single();

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData as any as Feedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p>Loading feedback...</p>
      </div>
    );
  }

  if (!feedback || !response) {
    return (
      <div className="text-center py-12">
        <p>No feedback available</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Practice
        </Button>
      </div>

      {/* Disclaimer */}
      <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm mb-1">Practice Feedback</p>
              <p className="text-sm text-muted-foreground">
                This is AI-generated practice feedback to help you improve. 
                It does not represent actual interview outcomes or scoring from real companies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
              {feedback.overall_score.toFixed(1)}
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              {getScoreLabel(feedback.overall_score)} / 10
            </p>
            <Progress value={feedback.overall_score * 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-3">Understanding the Rubric:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Relevance (0-10):</strong> How directly you answered the question</li>
              <li><strong>Specificity (0-10):</strong> Use of concrete examples and details</li>
              <li><strong>Impact (0-10):</strong> Demonstration of meaningful results</li>
              <li><strong>Clarity (0-10):</strong> Structure and ease of understanding</li>
            </ul>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Relevance', score: feedback.relevance_score },
              { label: 'Specificity', score: feedback.specificity_score },
              { label: 'Impact', score: feedback.impact_score },
              { label: 'Clarity', score: feedback.clarity_score }
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                    {item.score}/10
                  </span>
                </div>
                <Progress value={item.score * 10} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* STAR Framework (Behavioral only) */}
      {feedback.star_adherence && question.category === 'behavioral' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              STAR Framework Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Situation', present: feedback.star_adherence.situation },
                { label: 'Task', present: feedback.star_adherence.task },
                { label: 'Action', present: feedback.star_adherence.action },
                { label: 'Result', present: feedback.star_adherence.result }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-3 border rounded-lg">
                  {item.present ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{feedback.star_adherence.feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            General Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{feedback.general_feedback}</p>
        </CardContent>
      </Card>

      {/* Speaking Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Speaking Time Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold mb-2">{formatTime(feedback.speaking_time_estimate)}</p>
          <p className="text-sm text-muted-foreground">
            Estimated time to speak this response at a natural pace
          </p>
          {response.time_taken > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              You wrote this in {formatTime(response.time_taken)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alternative Approaches */}
      {feedback.alternative_approaches && feedback.alternative_approaches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Alternative Approaches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.alternative_approaches.map((approach, idx) => (
              <div key={idx} className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-sm mb-2">Approach {idx + 1}</p>
                <p className="text-sm text-muted-foreground">{approach}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Your Response */}
      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{response.response_text}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};