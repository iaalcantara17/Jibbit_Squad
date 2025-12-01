/**
 * Sprint 3 Demo Runner - Complete Implementation
 * Guided demo interface with automated readiness checks
 */

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, Database, Play, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { seedDemoData, type SeedResult } from '@/lib/demo/seedDemoData';
import { DEMO_ACTIONS, type DemoAction } from '@/lib/demo/demoActions';

const DemoSprint3 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [verificationResults, setVerificationResults] = useState<Map<string, { pass: boolean; message: string }>>(new Map());

  const handleSeedData = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    setIsSeeding(true);
    try {
      const result = await seedDemoData(user.id);
      setSeedResult(result);
      toast.success('Demo data seeded successfully!');
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed demo data. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleVerifyAction = async (action: DemoAction) => {
    if (!user) return;

    setIsVerifying(true);
    try {
      const result = await action.verifyFn(user.id);
      setVerificationResults(new Map(verificationResults.set(action.id, result)));
    } catch (error) {
      console.error('Verify error:', error);
      setVerificationResults(new Map(verificationResults.set(action.id, { pass: false, message: 'Verification error' })));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAll = async () => {
    if (!user) return;

    setIsVerifying(true);
    const results = new Map<string, { pass: boolean; message: string }>();
    
    for (const action of DEMO_ACTIONS) {
      try {
        const result = await action.verifyFn(user.id);
        results.set(action.id, result);
      } catch (error) {
        results.set(action.id, { pass: false, message: 'Error during verification' });
      }
    }

    setVerificationResults(results);
    setIsVerifying(false);

    const passCount = Array.from(results.values()).filter(r => r.pass).length;
    toast.success(`Verification complete: ${passCount}/${DEMO_ACTIONS.length} actions ready`);
  };

  const handleSeedAndVerify = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    // First seed
    setIsSeeding(true);
    try {
      const result = await seedDemoData(user.id);
      setSeedResult(result);
      toast.success('Demo data seeded successfully!');
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed demo data. Check console for details.');
      setIsSeeding(false);
      return;
    }
    setIsSeeding(false);

    // Then verify all
    await handleVerifyAll();
  };

  const groupedActions = DEMO_ACTIONS.reduce((acc, action) => {
    if (!acc[action.act]) acc[action.act] = [];
    acc[action.act].push(action);
    return acc;
  }, {} as Record<string, DemoAction[]>);

  const acts = Object.keys(groupedActions);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 container py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Sprint 3 Demo Runner</h1>
            <p className="text-muted-foreground">Comprehensive demo system with automated readiness checks</p>
          </div>

          {/* Seed & Verify Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Demo Data Management
              </CardTitle>
              <CardDescription>
                Load demo data to populate your account, then verify all actions are ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSeedData} disabled={isSeeding || isVerifying || !user}>
                  {isSeeding ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                  Load Demo Data
                </Button>
                <Button onClick={handleVerifyAll} disabled={isVerifying || isSeeding || !user} variant="secondary">
                  {isVerifying ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Verify All
                </Button>
                <Button onClick={handleSeedAndVerify} disabled={isSeeding || isVerifying || !user} variant="default" className="bg-primary">
                  {isSeeding || isVerifying ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Seed + Verify
                </Button>
              </div>

              {seedResult && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Seed Summary:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Jobs: {seedResult.jobs}</div>
                    <div>Interviews: {seedResult.interviews}</div>
                    <div>Questions: {seedResult.questionBank}</div>
                    <div>Contacts: {seedResult.contacts}</div>
                    <div>Mock Sessions: {seedResult.mockSessions}</div>
                    <div>Offers: {seedResult.offers}</div>
                    <div>Events: {seedResult.networkingEvents}</div>
                    <div>References: {seedResult.professionalReferences}</div>
                  </div>
                </div>
              )}

              {verificationResults.size > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Verification Summary:</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      PASS: {Array.from(verificationResults.values()).filter(r => r.pass).length}
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      FAIL: {Array.from(verificationResults.values()).filter(r => !r.pass).length}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demo Actions by Act */}
          <Tabs defaultValue={acts[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {acts.map((act, idx) => (
                <TabsTrigger key={act} value={act}>
                  Act {idx + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {acts.map(act => (
              <TabsContent key={act} value={act} className="space-y-4 mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">{act}</h2>
                </div>
                
                <div className="grid gap-4">
                  {groupedActions[act].map(action => {
                    const verification = verificationResults.get(action.id);
                    return (
                      <Card key={action.id} className="relative">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {action.label}
                                {verification && (
                                  verification.pass ? 
                                    <Badge variant="default" className="bg-green-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      PASS
                                    </Badge> :
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      FAIL
                                    </Badge>
                                )}
                              </CardTitle>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleVerifyAction(action)} disabled={isVerifying || !user}>
                                <Play className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                              <Button size="sm" onClick={() => navigate(action.goToRoute)}>
                                <ArrowRight className="h-4 w-4 ml-1" />
                                Go
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold mb-1">What to show:</p>
                            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                              {action.whatToShow.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {verification && (
                            <div className={`p-3 rounded-md text-sm ${verification.pass ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100' : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'}`}>
                              <div className="flex items-start gap-2">
                                {verification.pass ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                                <span>{verification.message}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Integration Status & Fallbacks */}
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <AlertCircle className="h-5 w-5" />
                Integration Status & Manual Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 dark:text-amber-100 space-y-3">
              <div>
                <p className="font-semibold mb-1">✓ Working Integrations:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Google Calendar OAuth (configured for calendar sync)</li>
                  <li>In-app reminders and notifications</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">⚠ Fallback Implementations:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>LinkedIn OAuth:</strong> Not configured. Use manual LinkedIn URL field in Profile settings.</li>
                  <li><strong>Calendar Export:</strong> ICS export (.ics file download) available for all interviews as backup.</li>
                  <li><strong>PDF Export:</strong> Not configured. Print-friendly pages available (use browser Print → Save as PDF).</li>
                  <li><strong>AI Features:</strong> Rules-based coaching and recommendations (no external AI provider configured).</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">👥 Manual Required:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Team Collaboration:</strong> To demo mentor/team features, manually invite a second member via email (Act 4).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoSprint3;
