import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-114: GitHub Repository Showcase Integration
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

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, username, repos } = await req.json();

    switch (action) {
      case 'fetch_repos': {
        if (!username) {
          return new Response(
            JSON.stringify({ error: 'GitHub username required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check rate limit
        const { data: rateLimit } = await supabase
          .from('api_rate_limits')
          .select('*')
          .eq('api_name', 'github')
          .single();

        if (rateLimit && rateLimit.current_usage >= rateLimit.daily_limit) {
          return new Response(
            JSON.stringify({ error: 'GitHub API rate limit exceeded' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch public repos from GitHub API
        const startTime = Date.now();
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'ATS-Candidates-App'
            }
          }
        );

        const responseTime = Date.now() - startTime;

        // Update rate limit tracking
        if (rateLimit) {
          await supabase
            .from('api_rate_limits')
            .update({ 
              current_usage: rateLimit.current_usage + 1,
              average_response_ms: Math.round((rateLimit.average_response_ms || responseTime + responseTime) / 2)
            })
            .eq('api_name', 'github');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('GitHub API error:', errorText);
          
          await supabase
            .from('api_rate_limits')
            .update({ 
              last_error: errorText,
              last_error_at: new Date().toISOString()
            })
            .eq('api_name', 'github');

          return new Response(
            JSON.stringify({ error: 'Failed to fetch GitHub repos' }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const githubRepos = await response.json();

        // Fetch user profile
        const profileResponse = await fetch(
          `https://api.github.com/users/${username}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'ATS-Candidates-App'
            }
          }
        );

        const profile = profileResponse.ok ? await profileResponse.json() : null;

        // Transform repos data
        const repos = githubRepos.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          watchers_count: repo.watchers_count,
          open_issues_count: repo.open_issues_count,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          topics: repo.topics || [],
          homepage: repo.homepage
        }));

        // Save integration data
        await supabase
          .from('github_integrations')
          .upsert({
            user_id: user.id,
            github_username: username,
            public_repos: profile?.public_repos || repos.length,
            followers: profile?.followers || 0,
            avatar_url: profile?.avatar_url,
            profile_url: profile?.html_url,
            last_synced_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        return new Response(
          JSON.stringify({ 
            repos,
            profile: profile ? {
              login: profile.login,
              name: profile.name,
              bio: profile.bio,
              public_repos: profile.public_repos,
              followers: profile.followers,
              following: profile.following,
              avatar_url: profile.avatar_url,
              html_url: profile.html_url
            } : null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'save_featured': {
        if (!repos || !Array.isArray(repos)) {
          return new Response(
            JSON.stringify({ error: 'Repos array required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('certifications')
          .eq('user_id', user.id)
          .single();

        const certifications = profile?.certifications || [];
        
        // Add GitHub repos as certifications
        const githubCerts = repos.map((repo: any) => ({
          type: 'github_repo',
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          updated: repo.updated_at
        }));

        // Merge with existing certifications (remove old github repos first)
        const nonGithubCerts = certifications.filter((c: any) => c.type !== 'github_repo');
        const updatedCerts = [...nonGithubCerts, ...githubCerts];

        await supabase
          .from('profiles')
          .update({ certifications: updatedCerts })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, featuredCount: githubCerts.length }),
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
    console.error('Error in github-integration:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});