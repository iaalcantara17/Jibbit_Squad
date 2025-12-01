import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Clock, 
  Save, 
  Send, 
  Loader2,
  Play,
  Pause,
  RotateCcw,
  History as HistoryIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { QuestionPracticeFeedback } from '@/components/interviews/QuestionPracticeFeedback';
import { QuestionPracticeHistory } from '@/components/interviews/QuestionPracticeHistory';

interface Question {
  id: string;
  question_text: string;
  category: string;
  difficulty: string;
  role_title: string;
  star_framework_hint: string | null;
}

const QuestionPractice = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Timer state
  const [timerDuration, setTimerDuration] = useState<number | null>(null); // in minutes
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
  // Feedback state
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadQuestion();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [questionId, user]);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          if (timerDuration && newTime >= timerDuration * 60) {
            setTimerActive(false);
            toast.info('Time is up!');
            return timerDuration * 60;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, timerDuration]);

  const loadQuestion = async () => {
    if (!user || !questionId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_bank_items')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) throw error;
      setQuestion(data);
    } catch (error) {
      console.error('Error loading question:', error);
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!timerDuration) {
      toast.error('Please select a timer duration');
      return;
    }
    setTimeElapsed(0);
    setTimerActive(true);
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimeElapsed(0);
    setTimerActive(false);
  };

  const saveDraft = async () => {
    if (!user || !questionId || !responseText.trim()) {
      toast.error('Please write a response before saving');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('question_practice_responses')
        .insert({
          user_id: user.id,
          question_id: questionId,
          response_text: responseText,
          timer_duration: timerDuration,
          time_taken: timeElapsed,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentResponseId(data.id);
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const submitForFeedback = async () => {
    if (!user || !questionId || !responseText.trim()) {
      toast.error('Please write a response before submitting');
      return;
    }

    setSubmitting(true);
    try {
      // Save response first
      const { data: responseData, error: saveError } = await supabase
        .from('question_practice_responses')
        .insert({
          user_id: user.id,
          question_id: questionId,
          response_text: responseText,
          timer_duration: timerDuration,
          time_taken: timeElapsed,
          status: 'submitted'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setCurrentResponseId(responseData.id);

      // Request AI feedback
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke(
        'ai-question-feedback',
        { body: { responseId: responseData.id } }
      );

      if (feedbackError) throw feedbackError;

      toast.success('Feedback generated successfully!');
      setShowFeedback(true);
      setTimerActive(false);
    } catch (error: any) {
      console.error('Error submitting for feedback:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate feedback');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Question Not Found</h2>
            <Button onClick={() => navigate('/question-bank')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Question Bank
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showFeedback && currentResponseId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto">
            <QuestionPracticeFeedback
              responseId={currentResponseId}
              question={question}
              onBack={() => {
                setShowFeedback(false);
                setResponseText('');
                setTimeElapsed(0);
                setTimerActive(false);
                setCurrentResponseId(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto">
            <QuestionPracticeHistory
              questionId={questionId!}
              question={question}
              onBack={() => setShowHistory(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/question-bank')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Question Bank
            </Button>
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <HistoryIcon className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-3">{question.question_text}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge>{question.category}</Badge>
                    <Badge variant="outline">{question.difficulty}</Badge>
                    <Badge variant="secondary">{question.role_title}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            {question.star_framework_hint && (
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">STAR Framework Guide:</p>
                  <p className="text-sm whitespace-pre-line">{question.star_framework_hint}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Timer Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Practice Timer (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select 
                    value={timerDuration?.toString() || ''} 
                    onValueChange={(v) => setTimerDuration(v ? parseInt(v) : null)}
                    disabled={timerActive}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="8">8 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-2xl font-mono font-bold min-w-[80px]">
                  {formatTime(timeElapsed)}
                </div>
                {!timerActive ? (
                  <Button onClick={timeElapsed === 0 ? startTimer : toggleTimer} variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    {timeElapsed === 0 ? 'Start' : 'Resume'}
                  </Button>
                ) : (
                  <Button onClick={toggleTimer} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={resetTimer} variant="ghost" size="icon">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex gap-3">
                <Button
                  onClick={saveDraft}
                  disabled={saving || !responseText.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={submitForFeedback}
                  disabled={submitting || !responseText.trim()}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Generating Feedback...' : 'Submit for Feedback'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuestionPractice;