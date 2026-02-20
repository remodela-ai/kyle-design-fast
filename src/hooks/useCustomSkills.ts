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

export type GenerationPhase = 
  | "idle"
  | "analyzing"
  | "designing"
  | "coding"
  | "testing"
  | "deploying"
  | "complete"
  | "error";

export const GENERATION_PHASES: { phase: GenerationPhase; label: string; detail: string; duration: number }[] = [
  { phase: "analyzing", label: "Analyzing requirements", detail: "Reading your role definition, knowledge base, and instructions...", duration: 3000 },
  { phase: "designing", label: "Designing architecture", detail: "Planning components, data flow, and UI layout...", duration: 4000 },
  { phase: "coding", label: "Writing code", detail: "Generating HTML, CSS, and interactive logic...", duration: 8000 },
  { phase: "testing", label: "Running tests", detail: "Validating output matches your specifications...", duration: 3000 },
  { phase: "deploying", label: "Deploying skill", detail: "Making your skill available as a new page...", duration: 2000 },
];

export function useCustomSkills() {
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("idle");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
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

  const simulateGeneration = useCallback(async () => {
    setGenerationLogs([]);

    for (const { phase, label, detail, duration } of GENERATION_PHASES) {
      setGenerationPhase(phase);
      setGenerationLogs((prev) => [...prev, `▸ ${label}`]);

      // Add sub-logs for coding phase
      if (phase === "coding") {
        const codingSteps = [
          "  Creating base HTML template...",
          "  Applying brand styles and layout...",
          "  Building interactive components...",
          "  Integrating data bindings...",
          "  Optimizing for responsiveness...",
        ];
        for (const step of codingSteps) {
          await new Promise((r) => setTimeout(r, duration / codingSteps.length));
          setGenerationLogs((prev) => [...prev, step]);
        }
      } else {
        await new Promise((r) => setTimeout(r, duration));
        setGenerationLogs((prev) => [...prev, `  ✓ ${detail}`]);
      }
    }
  }, []);

  const createSkill = useCallback(async (prompt: string, name: string, description: string) => {
    // Start visual generation simulation
    const simulationPromise = simulateGeneration();

    // 1. Call kyle-manus-bridge in parallel
    const { data: fnData, error: fnError } = await supabase.functions.invoke("kyle-manus-bridge", {
      body: {
        command: prompt,
        action_type: "create",
        context: { additional_context: `Skill Builder request: ${name} - ${description}` },
      },
    });

    if (fnError) {
      setGenerationPhase("error");
      setGenerationLogs((prev) => [...prev, `✗ Error: ${fnError.message}`]);
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
      setGenerationPhase("error");
      setGenerationLogs((prev) => [...prev, `✗ Error: ${error.message}`]);
      toast({ title: "Error saving skill", description: error.message, variant: "destructive" });
      return null;
    }

    // Wait for simulation to finish
    await simulationPromise;

    setGenerationPhase("complete");
    setGenerationLogs((prev) => [...prev, "▸ Skill created successfully!", `  → Task ID: ${taskId || "pending"}`]);

    toast({ title: "Skill building started!", description: "Kyle is creating your new skill." });
    await fetchSkills();
    return data as unknown as CustomSkill;
  }, [toast, fetchSkills, simulateGeneration]);

  const resetGeneration = useCallback(() => {
    setGenerationPhase("idle");
    setGenerationLogs([]);
  }, []);

  const readySkills = skills.filter((s) => s.status === "ready");

  return { skills, readySkills, loading, createSkill, refetch: fetchSkills, generationPhase, generationLogs, resetGeneration };
}
