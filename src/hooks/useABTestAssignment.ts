// UC-120: Hook for A/B test random assignment when creating applications
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ABTestAssignment {
  testId: string;
  variant: 'A' | 'B';
  variantId: string | null;
  variantType: string;
}

export function useABTestAssignment() {
  const { user } = useAuth();
  const [activeTest, setActiveTest] = useState<{
    id: string;
    variant_a_id: string | null;
    variant_a_type: string;
    variant_b_id: string | null;
    variant_b_type: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchActiveTest();
    }
  }, [user]);

  const fetchActiveTest = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('application_ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setActiveTest(data);
      }
    } catch {
      // No active test
    }
  };

  // Randomly assign variant when creating an application
  const getRandomAssignment = (): ABTestAssignment | null => {
    if (!activeTest) return null;

    // Random 50/50 assignment
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    
    return {
      testId: activeTest.id,
      variant,
      variantId: variant === 'A' ? activeTest.variant_a_id : activeTest.variant_b_id,
      variantType: variant === 'A' ? activeTest.variant_a_type : activeTest.variant_b_type,
    };
  };

  // Record the application result for the A/B test
  const recordApplication = async (jobId: string): Promise<ABTestAssignment | null> => {
    if (!activeTest || !user) return null;

    const assignment = getRandomAssignment();
    if (!assignment) return null;

    try {
      await supabase.from('application_ab_test_results').insert({
        test_id: assignment.testId,
        job_id: jobId,
        variant: assignment.variant,
        applied_at: new Date().toISOString(),
        response_received: false,
      });

      return assignment;
    } catch (error) {
      console.error('Failed to record A/B test result:', error);
      return null;
    }
  };

  // Update result when we get a response
  const recordResponse = async (
    jobId: string, 
    responseType: 'interview' | 'rejection' | 'offer' | 'no_response'
  ) => {
    if (!user) return;

    try {
      const { data: result } = await supabase
        .from('application_ab_test_results')
        .select('id, applied_at')
        .eq('job_id', jobId)
        .single();

      if (result) {
        const now = new Date();
        const appliedAt = new Date(result.applied_at);
        const daysToResponse = Math.ceil((now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60 * 24));

        await supabase
          .from('application_ab_test_results')
          .update({
            response_received: responseType !== 'no_response',
            response_type: responseType,
            response_at: responseType !== 'no_response' ? now.toISOString() : null,
            days_to_response: responseType !== 'no_response' ? daysToResponse : null,
          })
          .eq('id', result.id);
      }
    } catch (error) {
      console.error('Failed to record A/B test response:', error);
    }
  };

  return {
    activeTest,
    getRandomAssignment,
    recordApplication,
    recordResponse,
    hasActiveTest: !!activeTest,
  };
}
