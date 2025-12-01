import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TeamRole = "admin" | "mentor" | "candidate";

export const useTeamRole = (teamId: string | undefined) => {
  return useQuery({
    queryKey: ["team-role", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("team_memberships")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (error) return null;
      return data.role as TeamRole;
    },
    enabled: !!teamId,
  });
};
