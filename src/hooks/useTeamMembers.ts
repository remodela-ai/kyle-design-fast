import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  user_id: string;
  office_id: string;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
}

export function useTeamMembers(officeId: string | null) {
  return useQuery({
    queryKey: ['team-members', officeId],
    queryFn: async () => {
      if (!officeId) return [];
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('office_id', officeId)
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!officeId,
  });
}
