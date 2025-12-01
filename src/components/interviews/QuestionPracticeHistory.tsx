import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  TrendingUp,
  Calendar,
  Clock,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Question {
  question_text: string;
}

interface ResponseWithFeedback {
  id: string;
  response_text: string;
  time_taken: number;
  timer_duration: number | null;
  status: string;
  created_at: string;
  feedback: {
    overall_score: number;
    relevance_score: number;
    specificity_score: number;
    impact_score: number;
    clarity_score: number;
    general_feedback: string;
  } | null;
}

interface QuestionPracticeHistoryProps {
  questionId: string;
  question: Question;
  onBack: () => void;
}

export const QuestionPracticeHistory = ({ questionId, question, onBack }: QuestionPracticeHistoryProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<ResponseWithFeedback[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseWithFeedback | null>(null);

  useEffect(() => {
    loadHistory();
  }, [questionId, user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all responses for this question
      const { data: responsesData, error: responsesError } = await supabase
        .from('question_practice_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;

      // Get feedback for each response
      const responsesWithFeedback = await Promise.all(
        (responsesData || []).map(async (response) => {
          const { data: feedbackData } = await supabase
            .from('question_practice_feedback')
            .select('*')
            .eq('response_id', response.id)
            .single();

          return {
            ...response,
            feedback: feedbackData || null
          };
        })
      );

      setResponses(responsesWithFeedback);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load practice history');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chartData = responses
    .filter(r => r.feedback)
    .reverse()
    .map((r, idx) => ({
      attempt: idx + 1,
      score: r.feedback!.overall_score,
      date: format(new Date(r.created_at), 'MM/dd')
    }));

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p>Loading history...</p>
      </div>
    );
  }

  if (selectedResponse) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedResponse(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response Details</CardTitle>
              <Badge variant="outline">
                {format(new Date(selectedResponse.created_at), 'PPp')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Your Response:</p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedResponse.response_text}</p>
              </div>
            </div>

            {selectedResponse.time_taken > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time taken: {formatTime(selectedResponse.time_taken)}</span>
                {selectedResponse.timer_duration && (
                  <span>(Timer: {selectedResponse.timer_duration} min)</span>
                )}
              </div>
            )}

            {selectedResponse.feedback && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Scores:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Overall</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedResponse.feedback.overall_score)}`}>
                        {selectedResponse.feedback.overall_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Relevance</p>
                      <p className="text-xl font-bold">{selectedResponse.feedback.relevance_score}</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Specificity</p>
                      <p className="text-xl font-bold">{selectedResponse.feedback.specificity_score}</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Impact</p>
                      <p className="text-xl font-bold">{selectedResponse.feedback.impact_score}</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Clarity</p>
                      <p className="text-xl font-bold">{selectedResponse.feedback.clarity_score}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Feedback:</p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{selectedResponse.feedback.general_feedback}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
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

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium mb-1">Question:</p>
          <p className="text-sm text-muted-foreground">{question.question_text}</p>
        </CardContent>
      </Card>

      {responses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No practice attempts yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Trend Chart */}
          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="attempt" 
                      label={{ value: 'Attempt', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[0, 10]}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Response List */}
          <Card>
            <CardHeader>
              <CardTitle>All Attempts ({responses.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {responses.map((response, idx) => (
                <div 
                  key={response.id}
                  className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedResponse(response)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(new Date(response.created_at), 'PPp')}
                        </span>
                        <Badge variant={response.status === 'submitted' ? 'default' : 'secondary'}>
                          {response.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {response.response_text}
                      </p>
                      {response.time_taken > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(response.time_taken)}</span>
                        </div>
                      )}
                    </div>
                    {response.feedback && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(response.feedback.overall_score)}`}>
                          {response.feedback.overall_score.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};