import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomSkill {
  id: string;
  office_id: string | null;
  created_by: string | null;
  name: string;
  description: string;
  icon: string;
  action_type: string;
  manus_task_id: string | null;
  status: string;
  result_url: string | null;
  result_html: string | null;
  prompt: string;
  created_at: string;
  updated_at: string;
}

export function useCustomSkills() {
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyle_custom_skills" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching custom skills:", error);
    } else {
      setSkills((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const createSkill = useCallback(async (prompt: string, name: string, description: string) => {
    // 1. Call kyle-manus-bridge
    const { data: fnData, error: fnError } = await supabase.functions.invoke("kyle-manus-bridge", {
      body: {
        command: prompt,
        action_type: "create",
        context: { additional_context: `Skill Builder request: ${name} - ${description}` },
      },
    });

    if (fnError) {
      toast({ title: "Error", description: fnError.message, variant: "destructive" });
      return null;
    }

    const taskId = fnData?.task_id || fnData?.data?.id || null;

    // 2. Store in DB
    const { data, error } = await supabase
      .from("kyle_custom_skills" as any)
      .insert({
        name,
        description,
        prompt,
        manus_task_id: taskId,
        status: "building",
        icon: "🧩",
        action_type: "create",
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error saving skill", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Skill building started!", description: "Kyle is creating your new skill." });
    await fetchSkills();
    return data as unknown as CustomSkill;
  }, [toast, fetchSkills]);

  const readySkills = skills.filter((s) => s.status === "ready");

  return { skills, readySkills, loading, createSkill, refetch: fetchSkills };
}
