import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-119 & UC-120: Application Success Optimization & A/B Testing Dashboard
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, testData } = await req.json();

    switch (action) {
      case 'get_metrics': {
        // Get all jobs for analysis
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user.id);

        const allJobs = jobs || [];
        const appliedJobs = allJobs.filter(j => j.status !== 'interested');
        
        const metrics = {
          total_applications: appliedJobs.length,
          response_rate: 0,
          interview_conversion: 0,
          offer_rate: 0,
          avg_days_to_response: 0,
          by_approach: {
            direct: { applied: 0, responses: 0 },
            referral: { applied: 0, responses: 0 },
            networking: { applied: 0, responses: 0 }
          },
          by_day_of_week: {} as Record<string, { applied: number; responses: number }>,
          trends: [] as any[]
        };

        if (appliedJobs.length > 0) {
          const responses = appliedJobs.filter(j => 
            ['phone_screen', 'interview', 'offer', 'rejected'].includes(j.status)
          );
          const interviews = appliedJobs.filter(j => 
            ['interview', 'offer'].includes(j.status)
          );
          const offers = appliedJobs.filter(j => j.status === 'offer');

          metrics.response_rate = Math.round((responses.length / appliedJobs.length) * 100);
          metrics.interview_conversion = Math.round((interviews.length / appliedJobs.length) * 100);
          metrics.offer_rate = Math.round((offers.length / appliedJobs.length) * 100);

          // Calculate average days to response
          const responseTimes = responses
            .filter(j => j.status_updated_at && j.created_at)
            .map(j => {
              const created = new Date(j.created_at);
              const updated = new Date(j.status_updated_at);
              return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            });

          if (responseTimes.length > 0) {
            metrics.avg_days_to_response = Math.round(
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            );
          }

          // Analyze by day of week
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          for (const job of appliedJobs) {
            const day = days[new Date(job.created_at).getDay()];
            if (!metrics.by_day_of_week[day]) {
              metrics.by_day_of_week[day] = { applied: 0, responses: 0 };
            }
            metrics.by_day_of_week[day].applied++;
            if (['phone_screen', 'interview', 'offer'].includes(job.status)) {
              metrics.by_day_of_week[day].responses++;
            }
          }

          // Calculate monthly trends
          const monthlyData: Record<string, { applied: number; responses: number }> = {};
          for (const job of appliedJobs) {
            const month = new Date(job.created_at).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
              monthlyData[month] = { applied: 0, responses: 0 };
            }
            monthlyData[month].applied++;
            if (['phone_screen', 'interview', 'offer'].includes(job.status)) {
              monthlyData[month].responses++;
            }
          }

          metrics.trends = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
              month,
              ...data,
              rate: data.applied > 0 ? Math.round((data.responses / data.applied) * 100) : 0
            }));
        }

        return new Response(
          JSON.stringify({ metrics }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_recommendations': {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user.id);

        const recommendations = [];

        const appliedJobs = (jobs || []).filter(j => j.status !== 'interested');
        const responses = appliedJobs.filter(j => 
          ['phone_screen', 'interview', 'offer'].includes(j.status)
        );

        const responseRate = appliedJobs.length > 0 
          ? (responses.length / appliedJobs.length) * 100 
          : 0;

        if (responseRate < 10) {
          recommendations.push({
            priority: 'high',
            category: 'resume',
            title: 'Improve Resume Match',
            description: 'Your response rate is below 10%. Consider tailoring your resume more specifically to each job description.',
            action: 'Use AI to analyze job descriptions and optimize your resume for each application.'
          });
        }

        if (appliedJobs.length < 10) {
          recommendations.push({
            priority: 'medium',
            category: 'volume',
            title: 'Increase Application Volume',
            description: 'Apply to more positions to increase your chances. Consider expanding your search criteria.',
            action: 'Set a goal of applying to 5-10 positions per week.'
          });
        }

        const referralJobs = appliedJobs.filter(j => 
          j.notes?.toLowerCase().includes('referral') || 
          j.source?.toLowerCase().includes('referral')
        );

        if (referralJobs.length < appliedJobs.length * 0.2) {
          recommendations.push({
            priority: 'medium',
            category: 'networking',
            title: 'Leverage Your Network',
            description: 'Less than 20% of your applications come from referrals. Referrals typically have higher success rates.',
            action: 'Reach out to your network and request referrals for open positions.'
          });
        }

        return new Response(
          JSON.stringify({ recommendations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_ab_test': {
        if (!testData?.test_name || !testData?.variant_a_type || !testData?.variant_b_type) {
          return new Response(
            JSON.stringify({ error: 'Test name and variants are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: test } = await supabase
          .from('application_ab_tests')
          .insert({
            user_id: user.id,
            test_name: testData.test_name,
            variant_a_type: testData.variant_a_type,
            variant_a_id: testData.variant_a_id,
            variant_b_type: testData.variant_b_type,
            variant_b_id: testData.variant_b_id,
            is_active: true,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ test }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_ab_tests': {
        const { data: tests } = await supabase
          .from('application_ab_tests')
          .select(`
            *,
            results:application_ab_test_results(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Calculate statistics for each test
        const enrichedTests = (tests || []).map(test => {
          const results = test.results || [];
          const variantA = results.filter((r: any) => r.variant === 'A');
          const variantB = results.filter((r: any) => r.variant === 'B');

          const statsA = {
            count: variantA.length,
            responses: variantA.filter((r: any) => r.response_received).length,
            rate: variantA.length > 0 
              ? Math.round((variantA.filter((r: any) => r.response_received).length / variantA.length) * 100) 
              : 0
          };

          const statsB = {
            count: variantB.length,
            responses: variantB.filter((r: any) => r.response_received).length,
            rate: variantB.length > 0 
              ? Math.round((variantB.filter((r: any) => r.response_received).length / variantB.length) * 100) 
              : 0
          };

          // Calculate statistical significance (simplified)
          const minSampleSize = 10;
          const hasEnoughData = statsA.count >= minSampleSize && statsB.count >= minSampleSize;
          
          let significance = 'insufficient_data';
          let winner = null;
          
          if (hasEnoughData) {
            const diff = Math.abs(statsA.rate - statsB.rate);
            if (diff >= 15) {
              significance = 'significant';
              winner = statsA.rate > statsB.rate ? 'A' : 'B';
            } else if (diff >= 5) {
              significance = 'trending';
              winner = statsA.rate > statsB.rate ? 'A' : 'B';
            } else {
              significance = 'no_difference';
            }
          }

          return {
            ...test,
            stats: {
              variant_a: statsA,
              variant_b: statsB,
              significance,
              winner,
              total_applications: results.length
            }
          };
        });

        return new Response(
          JSON.stringify({ tests: enrichedTests }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'record_ab_result': {
        if (!testData?.test_id || !testData?.variant || !testData?.job_id) {
          return new Response(
            JSON.stringify({ error: 'Test ID, variant, and job ID are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: result } = await supabase
          .from('application_ab_test_results')
          .insert({
            test_id: testData.test_id,
            job_id: testData.job_id,
            variant: testData.variant,
            applied_at: new Date().toISOString(),
            response_received: testData.response_received || false,
            response_type: testData.response_type
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'end_ab_test': {
        if (!testData?.test_id) {
          return new Response(
            JSON.stringify({ error: 'Test ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('application_ab_tests')
          .update({ 
            is_active: false,
            ended_at: new Date().toISOString()
          })
          .eq('id', testData.test_id)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('Error in application-optimization:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
