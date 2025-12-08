import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  password?: string;
  confirmationText?: string;
  isOAuthUser?: boolean;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for user deletion
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Account deletion requested for user: ${user.id}`);

    // Parse request body
    const body: DeleteAccountRequest = await req.json();
    const { password, confirmationText, isOAuthUser } = body;

    // Determine if user is OAuth-based
    const provider = user.app_metadata?.provider;
    const isOAuth = isOAuthUser || (provider && provider !== 'email');

    // Verify credentials based on user type
    if (isOAuth) {
      // For OAuth users, require confirmation text
      if (confirmationText !== "DELETE MY ACCOUNT") {
        console.error("Invalid confirmation text for OAuth user");
        return new Response(
          JSON.stringify({ error: "Please type 'DELETE MY ACCOUNT' to confirm deletion" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For email/password users, verify password
      if (!password) {
        console.error("Password not provided for email user");
        return new Response(
          JSON.stringify({ error: "Password is required to delete your account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await userClient.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        console.error("Password verification failed:", signInError.message);
        return new Response(
          JSON.stringify({ error: "Invalid password. Please enter your correct password." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Password verified successfully");
    }

    // Delete user data from related tables first (cascade should handle most, but being explicit)
    const tables = [
      'employment_history',
      'education',
      'certifications',
      'special_projects',
      'user_skills',
      'resumes',
      'cover_letters',
      'jobs',
      'contacts',
      'networking_events',
      'profiles',
    ];

    for (const table of tables) {
      const { error: deleteError } = await adminClient
        .from(table)
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.warn(`Warning: Could not delete from ${table}:`, deleteError.message);
        // Continue anyway - the user deletion will cascade
      }
    }

    console.log("User data cleaned up from related tables");

    // Delete the user account using admin client
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error("Failed to delete user:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Account successfully deleted for user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Your account has been permanently deleted." 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Unexpected error in delete-account:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
