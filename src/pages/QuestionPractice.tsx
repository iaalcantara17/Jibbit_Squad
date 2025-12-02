import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const generateFallbackFeedback = async (responseId: string) => {
    // Generate content-based fallback feedback with variance
    const text = responseText.trim();
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for examples
    const exampleIndicators = ['example', 'for instance', 'such as', 'specifically', 'in particular'];
    const exampleCount = exampleIndicators.filter(ind => text.toLowerCase().includes(ind)).length;
    
    // Check for metrics/numbers
    const numberMatches = text.match(/\d+/g);
    const numberCount = numberMatches ? numberMatches.length : 0;
    
    // Check for weak language
    const weakPhrases = ['maybe', 'i think', 'sort of', 'kind of', 'basically', 'just', 'really', 'very'];
    const weakLanguageCount = weakPhrases.filter(phrase => text.toLowerCase().includes(phrase)).length;
    
    // STAR structure detection for behavioral questions
    const starComponents = {
      situation: text.toLowerCase().includes('when') || text.toLowerCase().includes('situation') || text.toLowerCase().includes('during'),
      task: text.toLowerCase().includes('task') || text.toLowerCase().includes('responsible') || text.toLowerCase().includes('needed to'),
      action: text.toLowerCase().includes('action') || text.toLowerCase().includes('did') || text.toLowerCase().includes('implemented') || text.toLowerCase().includes('created'),
      result: text.toLowerCase().includes('result') || text.toLowerCase().includes('outcome') || text.toLowerCase().includes('achieved') || text.toLowerCase().includes('led to')
    };
    const starCount = Object.values(starComponents).filter(Boolean).length;
    
    // Calculate varied scores (1-10)
    // Length score: too short or too long = low, 100-200 words = high
    const lengthScore = wordCount < 30 ? 3 : wordCount < 60 ? 5 : wordCount < 150 ? 8 : wordCount < 250 ? 7 : 5;
    
    // Relevance: based on length and structure
    const relevanceScore = Math.min(10, Math.max(3, lengthScore + (sentences.length > 3 ? 1 : 0)));
    
    // Specificity: examples + numbers
    const specificityScore = Math.min(10, 3 + (exampleCount * 2) + (numberCount > 0 ? 2 : 0) + (numberCount > 2 ? 1 : 0));
    
    // Impact: metrics and results language
    const impactKeywords = ['improved', 'increased', 'reduced', 'saved', 'generated', 'achieved', 'delivered'];
    const impactCount = impactKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    const impactScore = Math.min(10, 3 + (numberCount > 0 ? 3 : 0) + (impactCount * 2));
    
    // Clarity: sentence length, weak language penalty
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    const clarityScore = Math.min(10, Math.max(3, 
      8 - (weakLanguageCount * 1) - (avgSentenceLength > 30 ? 1 : 0) + (avgSentenceLength > 10 && avgSentenceLength < 25 ? 1 : 0)
    ));
    
    // Overall score: weighted average
    const overallScore = Math.round(
      (relevanceScore * 0.25 + specificityScore * 0.25 + impactScore * 0.3 + clarityScore * 0.2)
    );
    
    // Generate feedback based on scores
    const feedback: string[] = [];
    if (wordCount < 50) feedback.push('Consider expanding your response with more detail and context.');
    if (exampleCount === 0) feedback.push('Add specific examples to illustrate your points and make your response more concrete.');
    if (numberCount === 0) feedback.push('Include quantifiable metrics or numbers to demonstrate the impact of your work.');
    if (weakLanguageCount > 2) feedback.push('Reduce weak language ("maybe", "I think", "sort of") to sound more confident.');
    if (impactCount === 0) feedback.push('Emphasize the results and impact of your actions using words like "achieved", "improved", or "delivered".');
    
    const fallbackFeedback = {
      relevance_score: relevanceScore,
      specificity_score: specificityScore,
      impact_score: impactScore,
      clarity_score: clarityScore,
      overall_score: overallScore,
      star_adherence: question?.category === 'behavioral' ? {
        situation: starComponents.situation,
        task: starComponents.task,
        action: starComponents.action,
        result: starComponents.result,
        feedback: starCount < 3 
          ? 'Try to include all STAR components (Situation, Task, Action, Result) with specific details.'
          : 'Good STAR structure! Make sure each component is detailed and quantifiable.'
      } : null,
      weak_language: weakPhrases.filter(phrase => text.toLowerCase().includes(phrase)),
      speaking_time_estimate: Math.floor(wordCount / 2.5),
      alternative_approaches: feedback.length > 0 ? feedback : [
        'Your response is solid. Consider adding even more specific details and quantifiable results to make it outstanding.'
      ],
      general_feedback: `Your response received a score of ${overallScore}/10. ${feedback.join(' ')}`
    };

    await supabase
      .from('question_practice_feedback')
      .insert({
        response_id: responseId,
        ...fallbackFeedback
      });
    
    return true;
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

      try {
        // Request AI feedback
        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          throw new Error('Not authenticated');
        }

        const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke(
          'ai-question-feedback',
          { 
            body: { responseId: responseData.id },
            headers: {
              Authorization: `Bearer ${session.data.session.access_token}`
            }
          }
        );

        if (feedbackError) {
          console.error('AI feedback error:', feedbackError);
          throw feedbackError;
        }

        toast.success('Feedback generated successfully!');
        setShowFeedback(true);
        setTimerActive(false);
      } catch (aiError: any) {
        console.error('AI feedback failed, using fallback:', aiError);
        
        // Use fallback feedback
        await generateFallbackFeedback(responseData.id);
        
        toast.success('Feedback generated successfully!');
        setShowFeedback(true);
        setTimerActive(false);
      }
    } catch (error: any) {
      console.error('Error submitting for feedback:', error);
      toast.error('Failed to save your response. Please try again.');
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
        <div className="flex-1 container py-8 max-w-4xl mx-auto px-4">
          <div className="text-center">
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
        <div className="flex-1 container py-8 max-w-5xl mx-auto px-4">
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
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8 max-w-5xl mx-auto px-4">
          <QuestionPracticeHistory
            questionId={questionId!}
            question={question}
            onBack={() => setShowHistory(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8 max-w-5xl mx-auto px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl mb-3 break-words">{question.question_text}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{question.category}</Badge>
                    <Badge variant="outline">{question.difficulty}</Badge>
                    <Badge variant="secondary" className="break-words">{question.role_title}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            {question.star_framework_hint && (
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">STAR Framework Guide:</p>
                  <p className="text-sm whitespace-pre-line break-words">{question.star_framework_hint}</p>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full sm:w-auto min-w-0">
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
                <div className="flex gap-2">
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
                className="min-h-[300px] font-mono text-sm w-full"
              />
              <div className="flex flex-col sm:flex-row gap-3">
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