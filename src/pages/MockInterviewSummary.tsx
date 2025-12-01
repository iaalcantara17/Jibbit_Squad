import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, TrendingUp, TrendingDown, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MockInterviewSummary() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadSummary();
  }, [sessionId, user]);

  const loadSummary = async () => {
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

      // Check if summary exists
      const { data: existingSummary } = await supabase
        .from('mock_interview_summaries')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingSummary) {
        setSummary(existingSummary);
      } else {
        // Generate rule-based summary
        await generateRuleBasedSummary(sessionId);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interview summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRuleBasedSummary = async (sessionId: string) => {
    try {
      const { data: responses, error: responsesError } = await supabase
        .from('mock_interview_responses')
        .select(`
          *,
          question:question_bank_items(category, difficulty)
        `)
        .eq('session_id', sessionId);

      if (responsesError) throw responsesError;

      const answered = responses?.filter(r => r.response_text) || [];
      const completionRate = (answered.length / (responses?.length || 1)) * 100;

      const avgLength = answered.length > 0
        ? answered.reduce((sum, r) => sum + (r.response_text?.length || 0), 0) / answered.length
        : 0;

      // Calculate category performance
      const categoryScores: Record<string, { count: number; totalLength: number }> = {};
      answered.forEach(r => {
        const cat = (r.question as any)?.category || 'unknown';
        if (!categoryScores[cat]) {
          categoryScores[cat] = { count: 0, totalLength: 0 };
        }
        categoryScores[cat].count++;
        categoryScores[cat].totalLength += r.response_text?.length || 0;
      });

      const categoryAvgs = Object.entries(categoryScores).map(([cat, data]) => ({
        category: cat,
        avgLength: data.totalLength / data.count,
      }));

      const strongest = categoryAvgs.reduce((a, b) => (a.avgLength > b.avgLength ? a : b), categoryAvgs[0]);
      const weakest = categoryAvgs.reduce((a, b) => (a.avgLength < b.avgLength ? a : b), categoryAvgs[0]);

      // Generate improvements
      const improvements = [];
      if (avgLength < 200) {
        improvements.push('Provide more detailed responses with specific examples');
      }
      if (completionRate < 100) {
        improvements.push('Complete all questions in future practice sessions');
      }
      if (weakest) {
        improvements.push(`Focus on improving ${weakest.category} question responses`);
      }

      const { data: newSummary, error: summaryError } = await supabase
        .from('mock_interview_summaries')
        .insert({
          session_id: sessionId,
          completion_rate: completionRate,
          avg_response_length: avgLength,
          strongest_category: strongest?.category || null,
          weakest_category: weakest?.category || null,
          top_improvements: improvements.slice(0, 3),
        })
        .select()
        .single();

      if (summaryError) throw summaryError;
      setSummary(newSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  const generateAISummary = async () => {
    if (!sessionId) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mock-interview-summary', {
        body: { sessionId },
      });

      if (error) throw error;

      // Reload summary with AI content
      await loadSummary();

      toast({
        title: 'AI summary generated',
        description: 'Your personalized feedback is ready',
      });
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      
      if (error.message?.includes('Rate limits exceeded')) {
        toast({
          title: 'Rate limit reached',
          description: 'Please try again in a few moments',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'AI summary unavailable',
          description: 'The rule-based summary is still available',
          variant: 'destructive',
        });
      }
    } finally {
      setGenerating(false);
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

  if (!session || !summary) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Summary not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/interview-prep')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold">Interview Complete!</h1>
              <p className="text-muted-foreground">
                {session.target_role} {session.company_name && `at ${session.company_name}`}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {session.format}
            </Badge>
          </div>

          {/* Practice Disclaimer */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is practice feedback only. Scores and suggestions are meant to help you improve, 
              not to predict actual interview outcomes.
            </AlertDescription>
          </Alert>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Completion Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">{Math.round(summary.completion_rate)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Response Length</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {summary.avg_response_length ? Math.round(summary.avg_response_length) : 0} chars
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Questions Answered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round((summary.completion_rate / 100) * session.question_count)} / {session.question_count}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Your strongest and weakest areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.strongest_category && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Strongest Category</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {summary.strongest_category}
                    </p>
                  </div>
                </div>
              )}

              {summary.weakest_category && summary.weakest_category !== summary.strongest_category && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <TrendingDown className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Area for Improvement</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {summary.weakest_category}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Improvements */}
          <Card>
            <CardHeader>
              <CardTitle>Top 3 Improvement Actions</CardTitle>
              <CardDescription>Focus on these areas for your next practice</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {summary.top_improvements?.map((improvement: string, idx: number) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{improvement}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {summary.ai_summary ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Powered Insights</CardTitle>
                </div>
                <CardDescription>Personalized feedback based on your responses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{summary.ai_summary}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Generate AI Insights</CardTitle>
                <CardDescription>Get personalized feedback powered by AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get deeper insights into your responses with AI analysis. This will provide
                  personalized recommendations based on your actual answers.
                </p>
                <Button onClick={generateAISummary} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate AI Insights
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={() => navigate('/interview-prep')}>
              Back to Interview Prep
            </Button>
            <Button onClick={() => window.location.reload()}>
              Start Another Mock Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}