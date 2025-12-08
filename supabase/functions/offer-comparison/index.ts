import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-127: Offer Evaluation & Comparison Tool
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

    const { action, offerIds, weights } = await req.json();

    switch (action) {
      case 'compare': {
        if (!offerIds || offerIds.length < 2) {
          return new Response(
            JSON.stringify({ error: 'At least 2 offer IDs required for comparison' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch offers
        const { data: offers, error } = await supabase
          .from('job_offers')
          .select('*')
          .eq('user_id', user.id)
          .in('id', offerIds);

        if (error || !offers || offers.length < 2) {
          return new Response(
            JSON.stringify({ error: 'Could not fetch offers' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Default weights
        const defaultWeights = {
          salary: 30,
          benefits: 20,
          growth: 15,
          culture: 15,
          balance: 10,
          location: 10
        };
        const w = { ...defaultWeights, ...weights };

        // Calculate total compensation and scores for each offer
        const comparisons = offers.map(offer => {
          // Calculate total compensation
          const baseSalary = offer.base_salary || 0;
          const bonus = offer.bonus || 0;
          const equity = offer.equity_value || 0;
          const signingBonus = offer.signing_bonus || 0;
          const healthValue = offer.health_insurance_value || 5000; // Estimate if not provided
          const retirementMatch = offer.retirement_match || 0;
          const ptoValue = (offer.pto_days || 15) * (baseSalary / 260); // PTO monetary value

          const totalComp = baseSalary + bonus + (equity / 4) + (signingBonus / 4) + healthValue + retirementMatch + ptoValue;

          // Cost of living adjustment
          const colIndex = offer.cost_of_living_index || 100;
          const adjustedComp = totalComp * (100 / colIndex);

          // Calculate weighted score
          const maxSalary = Math.max(...offers.map(o => o.base_salary || 0));
          const salaryScore = maxSalary > 0 ? ((baseSalary / maxSalary) * 100) : 50;
          
          const benefitsScore = Math.min(100, 
            (healthValue / 10000 * 30) + 
            ((offer.pto_days || 0) / 30 * 40) + 
            ((retirementMatch / baseSalary) * 100 * 30 || 0)
          );

          const growthScore = offer.growth_score || 50;
          const cultureScore = offer.culture_score || 50;
          const balanceScore = offer.work_life_balance_score || 50;
          const locationScore = offer.remote_policy === 'remote' ? 80 : offer.remote_policy === 'hybrid' ? 70 : 60;

          const weightedScore = 
            (salaryScore * w.salary / 100) +
            (benefitsScore * w.benefits / 100) +
            (growthScore * w.growth / 100) +
            (cultureScore * w.culture / 100) +
            (balanceScore * w.balance / 100) +
            (locationScore * w.location / 100);

          return {
            offer_id: offer.id,
            company_name: offer.company_name,
            job_title: offer.job_title,
            base_salary: baseSalary,
            total_compensation: Math.round(totalComp),
            col_adjusted_compensation: Math.round(adjustedComp),
            scores: {
              salary: Math.round(salaryScore),
              benefits: Math.round(benefitsScore),
              growth: growthScore,
              culture: cultureScore,
              balance: balanceScore,
              location: locationScore
            },
            weighted_score: Math.round(weightedScore * 10) / 10,
            details: {
              bonus,
              equity_value: equity,
              signing_bonus: signingBonus,
              health_insurance_value: healthValue,
              retirement_match: retirementMatch,
              pto_days: offer.pto_days,
              pto_value: Math.round(ptoValue),
              remote_policy: offer.remote_policy,
              location: offer.location,
              start_date: offer.start_date,
              deadline: offer.deadline
            }
          };
        });

        // Sort by weighted score
        comparisons.sort((a, b) => b.weighted_score - a.weighted_score);
        const winner = comparisons[0];

        // Generate negotiation recommendations
        const negotiationTips = generateNegotiationTips(comparisons);

        return new Response(
          JSON.stringify({ 
            comparisons,
            winner: winner.offer_id,
            winner_details: winner,
            weights_used: w,
            negotiation_tips: negotiationTips
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scenario': {
        const { offerId, adjustments } = await req.json();
        
        // Fetch the offer
        const { data: offer } = await supabase
          .from('job_offers')
          .select('*')
          .eq('id', offerId)
          .eq('user_id', user.id)
          .single();

        if (!offer) {
          return new Response(
            JSON.stringify({ error: 'Offer not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Apply adjustments
        const scenarios = [];
        
        // Original
        const original = calculateTotalComp(offer);
        scenarios.push({ name: 'Current Offer', ...original });

        // With salary negotiation
        if (adjustments?.salary_increase) {
          const adjusted = { ...offer, base_salary: (offer.base_salary || 0) * (1 + adjustments.salary_increase / 100) };
          const result = calculateTotalComp(adjusted);
          scenarios.push({ 
            name: `+${adjustments.salary_increase}% Salary`, 
            ...result,
            difference: result.total_compensation - original.total_compensation
          });
        }

        // With signing bonus
        if (adjustments?.signing_bonus) {
          const adjusted = { ...offer, signing_bonus: adjustments.signing_bonus };
          const result = calculateTotalComp(adjusted);
          scenarios.push({ 
            name: `$${adjustments.signing_bonus.toLocaleString()} Signing Bonus`, 
            ...result,
            difference: result.total_compensation - original.total_compensation
          });
        }

        return new Response(
          JSON.stringify({ scenarios }),
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
    console.error('Error in offer-comparison:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateTotalComp(offer: any) {
  const baseSalary = offer.base_salary || 0;
  const bonus = offer.bonus || 0;
  const equity = offer.equity_value || 0;
  const signingBonus = offer.signing_bonus || 0;
  const healthValue = offer.health_insurance_value || 5000;
  const retirementMatch = offer.retirement_match || 0;
  const ptoValue = (offer.pto_days || 15) * (baseSalary / 260);

  return {
    base_salary: baseSalary,
    bonus,
    equity_annual: Math.round(equity / 4),
    signing_bonus_annual: Math.round(signingBonus / 4),
    health_value: healthValue,
    retirement_match: retirementMatch,
    pto_value: Math.round(ptoValue),
    total_compensation: Math.round(baseSalary + bonus + (equity / 4) + (signingBonus / 4) + healthValue + retirementMatch + ptoValue)
  };
}

function generateNegotiationTips(comparisons: any[]) {
  const tips = [];
  
  if (comparisons.length >= 2) {
    const top = comparisons[0];
    const second = comparisons[1];
    
    if (second.total_compensation > top.total_compensation * 0.9) {
      tips.push({
        type: 'leverage',
        message: `Your offers are close in value. Use ${second.company_name}'s offer as leverage to negotiate with ${top.company_name}.`
      });
    }

    if (top.scores.salary < 80 && top.weighted_score > second.weighted_score) {
      tips.push({
        type: 'salary',
        message: `${top.company_name} scores well overall but salary is below market. Consider negotiating a 10-15% increase.`
      });
    }

    if (comparisons.some(c => c.details.equity_value > 0) && comparisons.some(c => !c.details.equity_value)) {
      tips.push({
        type: 'equity',
        message: 'Some offers include equity while others don\'t. Consider asking for equity or a signing bonus to match total compensation.'
      });
    }
  }

  tips.push({
    type: 'general',
    message: 'Always negotiate! Most employers expect it and have budget flexibility.'
  });

  return tips;
}