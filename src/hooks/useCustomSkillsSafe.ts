import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight hook for sidebar — only fetches ready skills.
 * Avoids the heavier useCustomSkills hook which carries generation state
 * and can cause React HMR queue corruption when mounted in multiple trees.
 */
export function useCustomSkillsSafe() {
  const [readySkills, setReadySkills] = useState<{ id: string; name: string }[]>([]);

  const fetchReady = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("kyle_custom_skills" as any)
        .select("id, name")
        .eq("status", "ready")
        .order("created_at", { ascending: false });
      setReadySkills((data as any[]) || []);
    } catch {
      // silently fail — sidebar skill list is non-critical
    }
  }, []);

  useEffect(() => {
    fetchReady();
  }, [fetchReady]);

  return { readySkills };
}
