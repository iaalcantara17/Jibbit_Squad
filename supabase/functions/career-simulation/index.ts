import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-128: Career Path Simulation
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

    const { currentRole, currentSalary, targetRole, targetSalary, timeHorizonYears, successCriteria } = await req.json();

    if (!currentRole) {
      return new Response(
        JSON.stringify({ error: 'Current role is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a career advisor. Generate realistic career path simulations based on current market trends and typical career progressions. Provide multiple paths with probability distributions.`
          },
          {
            role: 'user',
            content: `Simulate career paths for:
Current Role: ${currentRole}
Current Salary: $${currentSalary || 'Not specified'}
Target Role: ${targetRole || 'Career growth'}
Target Salary: $${targetSalary || 'Not specified'}
Time Horizon: ${timeHorizonYears || 5} years
Success Criteria: ${JSON.stringify(successCriteria || {})}

Provide 3 different career paths with 5-year and 10-year projections, salary trajectories, and success probabilities.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'career_simulation',
            description: 'Return career path simulation data',
            parameters: {
              type: 'object',
              properties: {
                paths: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      success_probability: { type: 'number' },
                      year_1: { type: 'object', properties: { role: { type: 'string' }, salary: { type: 'number' } } },
                      year_3: { type: 'object', properties: { role: { type: 'string' }, salary: { type: 'number' } } },
                      year_5: { type: 'object', properties: { role: { type: 'string' }, salary: { type: 'number' } } },
                      year_10: { type: 'object', properties: { role: { type: 'string' }, salary: { type: 'number' } } },
                      key_milestones: { type: 'array', items: { type: 'string' } },
                      required_skills: { type: 'array', items: { type: 'string' } },
                      risk_factors: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                lifetime_earnings_comparison: {
                  type: 'object',
                  properties: {
                    path_1: { type: 'number' },
                    path_2: { type: 'number' },
                    path_3: { type: 'number' }
                  }
                },
                recommended_path: { type: 'number', description: 'Index of recommended path (0-2)' },
                recommendation_reason: { type: 'string' }
              },
              required: ['paths', 'recommended_path', 'recommendation_reason']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'career_simulation' } }
      }),
    });

    let simulation;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        simulation = JSON.parse(toolCall.function.arguments);
      }
    }

    if (!simulation) {
      // Fallback simulation
      const baseSalary = currentSalary || 80000;
      simulation = {
        paths: [
          {
            name: 'Steady Growth',
            description: 'Continue in current track with incremental promotions',
            success_probability: 0.75,
            year_1: { role: currentRole, salary: Math.round(baseSalary * 1.05) },
            year_3: { role: 'Senior ' + currentRole, salary: Math.round(baseSalary * 1.25) },
            year_5: { role: 'Lead ' + currentRole, salary: Math.round(baseSalary * 1.50) },
            year_10: { role: 'Director', salary: Math.round(baseSalary * 2.0) },
            key_milestones: ['First promotion (Year 2)', 'Lead team (Year 4)', 'Director (Year 8)'],
            required_skills: ['Leadership', 'Strategic thinking', 'Stakeholder management'],
            risk_factors: ['Market downturn', 'Company restructuring']
          },
          {
            name: 'Industry Switch',
            description: 'Transition to a higher-growth industry',
            success_probability: 0.55,
            year_1: { role: currentRole, salary: Math.round(baseSalary * 1.15) },
            year_3: { role: 'Senior ' + currentRole, salary: Math.round(baseSalary * 1.40) },
            year_5: { role: targetRole || 'Manager', salary: Math.round(baseSalary * 1.80) },
            year_10: { role: 'VP', salary: Math.round(baseSalary * 2.5) },
            key_milestones: ['Industry transition (Year 1)', 'Establish expertise (Year 3)', 'VP role (Year 7)'],
            required_skills: ['Domain expertise', 'Networking', 'Adaptability'],
            risk_factors: ['Learning curve', 'Network building', 'Cultural fit']
          },
          {
            name: 'Entrepreneurial Path',
            description: 'Start own venture or join early-stage startup',
            success_probability: 0.30,
            year_1: { role: 'Founder/Early Employee', salary: Math.round(baseSalary * 0.8) },
            year_3: { role: 'Leadership Role', salary: Math.round(baseSalary * 1.20) },
            year_5: { role: 'Executive', salary: Math.round(baseSalary * 2.0) },
            year_10: { role: 'C-Suite', salary: Math.round(baseSalary * 4.0) },
            key_milestones: ['Launch venture (Year 1)', 'Achieve product-market fit (Year 2)', 'Scale (Year 4)'],
            required_skills: ['Entrepreneurship', 'Risk tolerance', 'Resilience'],
            risk_factors: ['Financial risk', 'High failure rate', 'Work-life balance']
          }
        ],
        lifetime_earnings_comparison: {
          path_1: Math.round(baseSalary * 15),
          path_2: Math.round(baseSalary * 18),
          path_3: Math.round(baseSalary * 22)
        },
        recommended_path: 0,
        recommendation_reason: 'Based on typical career trajectories and your current position, the Steady Growth path offers the best balance of risk and reward.'
      };
    }

    // Save simulation
    const { data: saved } = await supabase
      .from('career_simulations')
      .insert({
        user_id: user.id,
        simulation_name: `${currentRole} Career Simulation`,
        starting_role: currentRole,
        starting_salary: currentSalary,
        target_role: targetRole,
        target_salary: targetSalary,
        time_horizon_years: timeHorizonYears || 5,
        paths: simulation.paths,
        success_criteria: successCriteria,
        selected_path_index: simulation.recommended_path
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({ simulation, saved }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in career-simulation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
