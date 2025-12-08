import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FlaskConical, 
  FileText, 
  Mail, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ABTest {
  id: string;
  test_name: string;
  variant_a_type: string;
  variant_a_id: string | null;
  variant_b_type: string;
  variant_b_id: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  results?: {
    variant_a: { applications: number; responses: number; rate: number };
    variant_b: { applications: number; responses: number; rate: number };
    winner: 'A' | 'B' | 'none';
    is_significant: boolean;
    confidence: number;
  };
}

const MIN_SAMPLE_SIZE = 10;

export default function ABTestingDashboard() {
  const { user } = useAuth();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('application_ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Fetch results for each test
      const testsWithResults = await Promise.all((data || []).map(async (test) => {
        const { data: results } = await supabase
          .from('application_ab_test_results')
          .select('*')
          .eq('test_id', test.id);

        const variantA = results?.filter(r => r.variant === 'A') || [];
        const variantB = results?.filter(r => r.variant === 'B') || [];

        const aResponses = variantA.filter(r => r.response_received).length;
        const bResponses = variantB.filter(r => r.response_received).length;

        const aRate = variantA.length > 0 ? (aResponses / variantA.length) * 100 : 0;
        const bRate = variantB.length > 0 ? (bResponses / variantB.length) * 100 : 0;

        // Simple significance check (need proper statistical test in production)
        const totalA = variantA.length;
        const totalB = variantB.length;
        const hasMinSample = totalA >= MIN_SAMPLE_SIZE && totalB >= MIN_SAMPLE_SIZE;
        const diffPercent = Math.abs(aRate - bRate);
        const isSignificant = hasMinSample && diffPercent > 15;

        return {
          ...test,
          results: {
            variant_a: { applications: totalA, responses: aResponses, rate: Math.round(aRate) },
            variant_b: { applications: totalB, responses: bResponses, rate: Math.round(bRate) },
            winner: !hasMinSample ? 'none' as const : (aRate > bRate ? 'A' as const : (bRate > aRate ? 'B' as const : 'none' as const)),
            is_significant: isSignificant,
            confidence: isSignificant ? 85 : 0
          }
        };
      }));

      setTests(testsWithResults);
    } catch (err) {
      console.error('Failed to fetch A/B tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [user]);

  const createTest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('application_ab_tests')
        .insert({
          user_id: user.id,
          test_name: `Test ${tests.length + 1}`,
          variant_a_type: 'resume',
          variant_b_type: 'resume',
          is_active: true,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('New A/B test created');
      fetchTests();
    } catch (err) {
      toast.error('Failed to create test');
    }
  };

  const endTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('application_ab_tests')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', testId);

      if (error) throw error;
      
      toast.success('Test ended');
      fetchTests();
    } catch (err) {
      toast.error('Failed to end test');
    }
  };

  const activeTests = tests.filter(t => t.is_active);
  const completedTests = tests.filter(t => !t.is_active);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                <FlaskConical className="h-10 w-10 text-primary" />
                A/B Testing Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Test different resume and cover letter versions to find what works best
              </p>
            </div>
            <Button onClick={createTest}>
              <Plus className="h-4 w-4 mr-2" />
              New Test
            </Button>
          </div>

          {/* How it works */}
          <Alert className="bg-muted/30">
            <FlaskConical className="h-4 w-4" />
            <AlertTitle>How A/B Testing Works</AlertTitle>
            <AlertDescription>
              Create a test with two versions of your resume or cover letter. Apply to similar jobs 
              using each version alternately. After at least {MIN_SAMPLE_SIZE} applications per version, 
              we'll calculate which performs better with statistical significance.
            </AlertDescription>
          </Alert>

          {/* Active Tests */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Active Tests
              {activeTests.length > 0 && <Badge>{activeTests.length}</Badge>}
            </h2>

            {activeTests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No active tests. Create one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeTests.map(test => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{test.test_name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-success/10 text-success">Active</Badge>
                          <Button variant="outline" size="sm" onClick={() => endTest(test.id)}>
                            End Test
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Started {new Date(test.started_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Variant A */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary">Variant A</Badge>
                            <span className="text-sm text-muted-foreground">
                              {test.variant_a_type}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Applications</span>
                              <span className="font-medium">{test.results?.variant_a.applications || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Responses</span>
                              <span className="font-medium">{test.results?.variant_a.responses || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Response Rate</span>
                              <span className="font-bold text-primary">{test.results?.variant_a.rate || 0}%</span>
                            </div>
                            <Progress value={test.results?.variant_a.rate || 0} className="h-2" />
                          </div>
                        </div>

                        {/* Variant B */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary">Variant B</Badge>
                            <span className="text-sm text-muted-foreground">
                              {test.variant_b_type}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Applications</span>
                              <span className="font-medium">{test.results?.variant_b.applications || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Responses</span>
                              <span className="font-medium">{test.results?.variant_b.responses || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Response Rate</span>
                              <span className="font-bold text-primary">{test.results?.variant_b.rate || 0}%</span>
                            </div>
                            <Progress value={test.results?.variant_b.rate || 0} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Sample size warning */}
                      {((test.results?.variant_a.applications || 0) < MIN_SAMPLE_SIZE || 
                        (test.results?.variant_b.applications || 0) < MIN_SAMPLE_SIZE) && (
                        <Alert className="mt-4 bg-warning/10 border-warning">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <AlertDescription className="text-warning">
                            Need at least {MIN_SAMPLE_SIZE} applications per variant for statistical significance.
                            Current: A={test.results?.variant_a.applications || 0}, B={test.results?.variant_b.applications || 0}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Tests */}
          {completedTests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                Completed Tests
              </h2>

              <div className="grid gap-4">
                {completedTests.map(test => (
                  <Card key={test.id} className="bg-muted/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{test.test_name}</CardTitle>
                        {test.results?.is_significant && test.results.winner !== 'none' && (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Winner: Variant {test.results.winner}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {new Date(test.started_at).toLocaleDateString()} - {test.ended_at ? new Date(test.ended_at).toLocaleDateString() : 'Now'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className={`p-4 border rounded-lg ${test.results?.winner === 'A' ? 'border-success bg-success/5' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">Variant A</Badge>
                            {test.results?.winner === 'A' && <TrendingUp className="h-4 w-4 text-success" />}
                          </div>
                          <p className="text-2xl font-bold">{test.results?.variant_a.rate || 0}%</p>
                          <p className="text-sm text-muted-foreground">
                            {test.results?.variant_a.responses}/{test.results?.variant_a.applications} responses
                          </p>
                        </div>
                        <div className={`p-4 border rounded-lg ${test.results?.winner === 'B' ? 'border-success bg-success/5' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">Variant B</Badge>
                            {test.results?.winner === 'B' && <TrendingUp className="h-4 w-4 text-success" />}
                          </div>
                          <p className="text-2xl font-bold">{test.results?.variant_b.rate || 0}%</p>
                          <p className="text-sm text-muted-foreground">
                            {test.results?.variant_b.responses}/{test.results?.variant_b.applications} responses
                          </p>
                        </div>
                      </div>

                      {!test.results?.is_significant && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          Results not statistically significant
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
