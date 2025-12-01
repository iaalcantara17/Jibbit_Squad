import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  category: string;
  difficulty: string;
  star_framework_hint?: string;
}

interface Response {
  question_id: string;
  question_order: number;
  is_followup: boolean;
  followup_rationale?: string;
  response_text?: string;
  time_taken?: number;
  started_at: string;
}

export default function MockInterviewSession() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId, user]);

  const loadSession = async () => {
    if (!user || !sessionId) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('mock_interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load existing responses
      const { data: existingResponses } = await supabase
        .from('mock_interview_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('question_order');

      if (existingResponses && existingResponses.length > 0) {
        setResponses(existingResponses as Response[]);
        setCurrentQuestionIndex(existingResponses.length);
      }

      // Load questions from question bank based on format
      const { data: questionData, error: questionError } = await supabase
        .from('question_bank_items')
        .select('*')
        .eq('category', sessionData.format)
        .eq('role_title', sessionData.target_role)
        .limit(sessionData.question_count);

      if (questionError) throw questionError;

      // If we don't have enough questions for exact role, get general questions
      if (!questionData || questionData.length < sessionData.question_count) {
        const { data: fallbackQuestions } = await supabase
          .from('question_bank_items')
          .select('*')
          .eq('category', sessionData.format)
          .limit(sessionData.question_count);

        setQuestions((fallbackQuestions || []) as Question[]);
      } else {
        setQuestions(questionData as Question[]);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mock interview session',
        variant: 'destructive',
      });
      navigate('/interview-prep');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!currentResponse.trim()) {
      toast({
        title: 'Response required',
        description: 'Please provide an answer before continuing',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      const currentQuestion = questions[currentQuestionIndex];

      const newResponse: Response = {
        question_id: currentQuestion.id,
        question_order: currentQuestionIndex,
        is_followup: false,
        response_text: currentResponse,
        time_taken: timeTaken,
        started_at: new Date(questionStartTime).toISOString(),
      };

      const { error } = await supabase
        .from('mock_interview_responses')
        .insert({
          session_id: sessionId,
          ...newResponse,
          answered_at: new Date().toISOString(),
        });

      if (error) throw error;

      setResponses([...responses, newResponse]);
      setCurrentResponse('');
      setQuestionStartTime(Date.now());

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Complete the session
        await supabase
          .from('mock_interview_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        navigate(`/mock-interview/${sessionId}/summary`);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your response',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No questions available for this session</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">Mock Interview</h1>
                <p className="text-muted-foreground">
                  {session.target_role} {session.company_name && `at ${session.company_name}`}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {session.format}
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
                  <CardTitle className="text-xl mb-2">{currentQuestion.question_text}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {currentQuestion.category}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.star_framework_hint && (
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
                  className="min-h-[250px]"
                />
                <p className="text-xs text-muted-foreground">
                  {currentResponse.length} characters
                </p>
              </div>

              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Take your time. There's no timer for this mock interview.
                </p>
                <Button onClick={handleNext} disabled={saving || !currentResponse.trim()}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Finish Interview
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="flex gap-1 justify-center">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-8 rounded-full transition-colors ${
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