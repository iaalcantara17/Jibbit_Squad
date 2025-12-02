import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Save, Send, Loader2, Lightbulb, BookOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  problem_statement: string;
  solution_framework: string | null;
  best_practices: string | null;
  hints: any;
}

interface Attempt {
  id: string;
  solution_code: string;
  language: string;
  rubric_checklist: {
    correctness: boolean;
    complexity: boolean;
    edge_cases: boolean;
    explanation: boolean;
  };
  notes: string;
  status: string;
  time_taken: number | null;
}

export default function TechnicalChallengeDetail() {
  const { challengeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [solutionCode, setSolutionCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [notes, setNotes] = useState('');
  const [rubric, setRubric] = useState({
    correctness: false,
    complexity: false,
    edge_cases: false,
    explanation: false,
  });
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    loadChallenge();
    loadAttempts();
  }, [challengeId, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, startTime]);

  const loadChallenge = async () => {
    if (!challengeId) return;

    try {
      const { data, error } = await supabase
        .from('technical_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (error) {
      console.error('Error loading challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenge',
        variant: 'destructive',
      });
      navigate('/technical-prep');
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    if (!user || !challengeId) return;

    try {
      const { data } = await supabase
        .from('technical_practice_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setPreviousAttempts(data as any);
        const latest = data[0] as any;
        if (latest.status === 'draft') {
          setCurrentAttempt(latest);
          setSolutionCode(latest.solution_code || '');
          setLanguage(latest.language || 'javascript');
          setNotes(latest.notes || '');
          setRubric(latest.rubric_checklist || rubric);
        }
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  const startTimer = () => {
    setTimerActive(true);
    setStartTime(Date.now() - (elapsedTime * 1000));
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const saveAttempt = async (status: 'draft' | 'submitted') => {
    if (!user || !challengeId) return;

    setSaving(true);
    try {
      const attemptData = {
        user_id: user.id,
        challenge_id: challengeId,
        solution_code: solutionCode,
        language,
        notes,
        rubric_checklist: rubric,
        status,
        time_taken: timerActive ? elapsedTime : null,
        ...(status === 'submitted' && { submitted_at: new Date().toISOString() }),
      };

      if (currentAttempt) {
        const { error } = await supabase
          .from('technical_practice_attempts')
          .update(attemptData)
          .eq('id', currentAttempt.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('technical_practice_attempts')
          .insert(attemptData)
          .select()
          .single();

        if (error) throw error;
        setCurrentAttempt(data as any);
      }

      toast({
        title: status === 'draft' ? 'Draft saved' : 'Solution submitted',
        description: status === 'draft' ? 'Your progress has been saved' : 'Your solution has been recorded',
      });

      if (status === 'submitted') {
        stopTimer();
        loadAttempts();
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your solution',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Challenge not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/technical-prep')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Challenges
              </Button>
              <h1 className="text-3xl font-display font-bold">{challenge.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {challenge.difficulty}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {challenge.category}
                </Badge>
              </div>
            </div>

            {/* Timer */}
            <Card className="w-[200px]">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Clock className="h-6 w-6 mx-auto text-muted-foreground" />
                  <div className="text-2xl font-mono font-bold">
                    {formatTime(elapsedTime)}
                  </div>
                  <Button
                    size="sm"
                    variant={timerActive ? 'destructive' : 'default'}
                    onClick={timerActive ? stopTimer : startTimer}
                    className="w-full"
                  >
                    {timerActive ? 'Stop' : 'Start Timer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Problem */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Problem Statement</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{challenge.problem_statement}</div>
                </CardContent>
              </Card>

              {challenge.hints && Array.isArray(challenge.hints) && challenge.hints.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Hints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {challenge.hints.map((hint: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {idx + 1}. {hint}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {(challenge.solution_framework || challenge.best_practices) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Solution Guide
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSolution(!showSolution)}
                      >
                        {showSolution ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </CardHeader>
                  {showSolution && (
                    <CardContent className="space-y-4">
                      {challenge.solution_framework && (
                        <div>
                          <h4 className="font-medium mb-2">Solution Framework</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {challenge.solution_framework}
                          </p>
                        </div>
                      )}
                      {challenge.best_practices && (
                        <div>
                          <h4 className="font-medium mb-2">Best Practices</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {challenge.best_practices}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </div>

            {/* Right Column - Solution Editor */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>My Solution</CardTitle>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CardDescription>
                    Write your solution below. Code is not executed - this is for practice and reference.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      height="400px"
                      language={language}
                      value={solutionCode}
                      onChange={(value) => setSolutionCode(value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Self-Evaluation Rubric</CardTitle>
                  <CardDescription>
                    Check off aspects you've covered in your solution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="correctness"
                      checked={rubric.correctness}
                      onCheckedChange={(checked) => 
                        setRubric({ ...rubric, correctness: checked as boolean })
                      }
                    />
                    <Label htmlFor="correctness" className="cursor-pointer">
                      <span className="font-medium">Correctness</span>
                      <p className="text-sm text-muted-foreground">Solution handles the main problem correctly</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="complexity"
                      checked={rubric.complexity}
                      onCheckedChange={(checked) => 
                        setRubric({ ...rubric, complexity: checked as boolean })
                      }
                    />
                    <Label htmlFor="complexity" className="cursor-pointer">
                      <span className="font-medium">Time/Space Complexity</span>
                      <p className="text-sm text-muted-foreground">Analyzed and optimized for efficiency</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edge_cases"
                      checked={rubric.edge_cases}
                      onCheckedChange={(checked) => 
                        setRubric({ ...rubric, edge_cases: checked as boolean })
                      }
                    />
                    <Label htmlFor="edge_cases" className="cursor-pointer">
                      <span className="font-medium">Edge Cases</span>
                      <p className="text-sm text-muted-foreground">Handles empty inputs, nulls, boundaries, etc.</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="explanation"
                      checked={rubric.explanation}
                      onCheckedChange={(checked) => 
                        setRubric({ ...rubric, explanation: checked as boolean })
                      }
                    />
                    <Label htmlFor="explanation" className="cursor-pointer">
                      <span className="font-medium">Clear Explanation</span>
                      <p className="text-sm text-muted-foreground">Can explain approach and trade-offs</p>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Additional thoughts or approaches</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write any notes about your solution, alternative approaches, or things to remember..."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveAttempt('draft')}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Draft
                </Button>
                <Button
                  onClick={() => saveAttempt('submitted')}
                  disabled={saving || !solutionCode.trim()}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit Solution
                </Button>
              </div>

              {previousAttempts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Previous Attempts ({previousAttempts.length})</CardTitle>
                    <CardDescription>
                      Click on any attempt to view its details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {previousAttempts.slice(0, 5).map((attempt) => (
                        <button
                          key={attempt.id}
                          onClick={() => {
                            setSolutionCode(attempt.solution_code || '');
                            setLanguage(attempt.language || 'javascript');
                            setNotes(attempt.notes || '');
                            setRubric(attempt.rubric_checklist || rubric);
                            setElapsedTime(attempt.time_taken || 0);
                            toast({
                              title: 'Attempt Loaded',
                              description: 'Previous attempt has been loaded into the editor',
                            });
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {attempt.status === 'submitted' ? 'Submitted' : 'Draft'} - {attempt.language}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attempt.time_taken ? formatTime(attempt.time_taken) : 'No time recorded'} • {Object.values(attempt.rubric_checklist).filter(Boolean).length}/4 criteria
                            </p>
                          </div>
                          <Badge variant="outline">View</Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}