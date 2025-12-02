import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';

interface Question {
  id: string;
  question_text: string;
  category: string;
  difficulty: string;
  star_framework_hint?: string;
}

// Error Boundary specifically for this page
class MockInterviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MockInterview Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle>Something went wrong</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.href = '/interview-prep'} 
                    className="flex-1"
                  >
                    Back to Interview Prep
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      this.props.onReset();
                    }} 
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MockInterviewContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponse, setCurrentResponse] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    if (!user) {
      // Wait for auth to complete
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('mock_interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to load session');
      }
      
      if (!sessionData) {
        setError('Session not found. It may have been deleted or you may not have permission to access it.');
        setLoading(false);
        return;
      }
      
      setSession(sessionData);

      // Load existing responses to determine where user left off
      const { data: existingResponses } = await supabase
        .from('mock_interview_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('question_order');

      if (existingResponses && existingResponses.length > 0) {
        setCurrentQuestionIndex(existingResponses.length);
      }

      // Load questions - try multiple strategies
      let loadedQuestions: Question[] = [];

      // Strategy 1: Match category and role
      const { data: exactMatch } = await supabase
        .from('question_bank_items')
        .select('id, question_text, category, difficulty, star_framework_hint')
        .eq('category', sessionData.format || 'behavioral')
        .eq('role_title', sessionData.target_role)
        .limit(sessionData.question_count || 10);

      if (exactMatch && exactMatch.length > 0) {
        loadedQuestions = exactMatch;
      }

      // Strategy 2: Just match category
      if (loadedQuestions.length === 0) {
        const { data: categoryMatch } = await supabase
          .from('question_bank_items')
          .select('id, question_text, category, difficulty, star_framework_hint')
          .eq('category', sessionData.format || 'behavioral')
          .limit(sessionData.question_count || 10);

        if (categoryMatch && categoryMatch.length > 0) {
          loadedQuestions = categoryMatch;
        }
      }

      // Strategy 3: Get any questions
      if (loadedQuestions.length === 0) {
        const { data: anyQuestions } = await supabase
          .from('question_bank_items')
          .select('id, question_text, category, difficulty, star_framework_hint')
          .limit(sessionData.question_count || 10);

        if (anyQuestions && anyQuestions.length > 0) {
          loadedQuestions = anyQuestions;
        }
      }

      if (loadedQuestions.length === 0) {
        setError('No questions available in the question bank. Please add some questions first.');
        setLoading(false);
        return;
      }

      setQuestions(loadedQuestions);
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load interview session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (!authLoading) {
      loadSession();
    }
  }, [authLoading, loadSession]);

  const handleNext = async () => {
    if (!currentResponse.trim()) {
      toast({
        title: 'Response required',
        description: 'Please provide an answer before continuing',
        variant: 'destructive',
      });
      return;
    }

    if (!questions[currentQuestionIndex]) {
      toast({
        title: 'Error',
        description: 'Question not found',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      const currentQuestion = questions[currentQuestionIndex];

      // Save response
      const { error: insertError } = await supabase
        .from('mock_interview_responses')
        .insert({
          session_id: sessionId,
          question_id: currentQuestion.id,
          question_order: currentQuestionIndex,
          is_followup: false,
          response_text: currentResponse,
          time_taken: timeTaken,
          started_at: new Date(questionStartTime).toISOString(),
          answered_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      setCurrentResponse('');
      setQuestionStartTime(Date.now());

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        // Complete the session
        await supabase
          .from('mock_interview_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        toast({
          title: 'Interview Complete!',
          description: 'View your summary and feedback',
        });

        navigate(`/mock-interview/${sessionId}/summary`);
      }
    } catch (err) {
      console.error('Error saving response:', err);
      toast({
        title: 'Error',
        description: 'Failed to save your response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading interview...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Unable to Load Interview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/interview-prep')} className="flex-1">
                  Back to Interview Prep
                </Button>
                <Button variant="outline" onClick={() => loadSession()} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show no questions state
  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>No Questions Available</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                There are no questions available. Please add questions to the question bank first.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/question-bank')} className="flex-1">
                  Go to Question Bank
                </Button>
                <Button variant="outline" onClick={() => navigate('/interview-prep')} className="flex-1">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Safely get current question
  const currentQuestion = questions[Math.min(currentQuestionIndex, questions.length - 1)];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold">Mock Interview</h1>
                <p className="text-muted-foreground">
                  {session?.target_role || 'Interview'} {session?.company_name && `at ${session.company_name}`}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {session?.format || 'behavioral'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-medium">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg md:text-xl mb-2">
                    {currentQuestion?.question_text || 'Question unavailable'}
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {currentQuestion?.category || 'general'}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {currentQuestion?.difficulty || 'medium'}
                    </Badge>
                  </div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion?.star_framework_hint && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-1">💡 STAR Framework Tip:</p>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.star_framework_hint}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Response</label>
                <Textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your answer here. Be specific and use examples..."
                  className="min-h-[200px] md:min-h-[250px]"
                />
                <p className="text-xs text-muted-foreground">
                  {currentResponse.length} characters
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Take your time. There's no timer.
                </p>
                <Button 
                  onClick={handleNext} 
                  disabled={saving || !currentResponse.trim()}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isLastQuestion ? (
                    <>
                      Finish Interview
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Question
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="flex gap-1 justify-center flex-wrap">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-6 md:w-8 rounded-full transition-colors ${
                  idx < currentQuestionIndex
                    ? 'bg-primary'
                    : idx === currentQuestionIndex
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockInterviewSession() {
  const [resetKey, setResetKey] = useState(0);
  
  return (
    <MockInterviewErrorBoundary onReset={() => setResetKey(k => k + 1)}>
      <MockInterviewContent key={resetKey} />
    </MockInterviewErrorBoundary>
  );
}
