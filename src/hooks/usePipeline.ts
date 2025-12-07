import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PipelineStep {
  stepNumber: number;
  stepName: string;
  status: "pending" | "processing" | "completed" | "error";
  output?: Record<string, unknown>;
  visualOutcomeUrl?: string;
  error?: string;
}

const PIPELINE_STEPS = [
  { number: 1, name: "Spatial Analysis", fn: "pipeline-spatial-analysis" },
  { number: 2, name: "Architectural Plans", fn: "pipeline-architectural-plans" },
  { number: 3, name: "Items Extraction", fn: "pipeline-items-extraction" },
  { number: 4, name: "Design Moodboard", fn: "pipeline-moodboard" },
  { number: 5, name: "Material Flatlay", fn: "pipeline-flatlay" },
  { number: 6, name: "Colors & Textures", fn: "pipeline-colors-textures" },
  { number: 7, name: "Your Story Book", fn: "pipeline-storybook" },
  { number: 8, name: "Video Presentation", fn: "pipeline-video-presentation" },
];

export function usePipeline() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(s => ({
      stepNumber: s.number,
      stepName: s.name,
      status: "pending",
    }))
  );
  const [memory, setMemory] = useState<Record<string, unknown>>({});

  // Subscribe to realtime updates for pipeline steps
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`pipeline-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pipeline_steps",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Pipeline step update:", payload);
          const step = payload.new as {
            step_number: number;
            status: string;
            output_data?: Record<string, unknown>;
            visual_outcome_url?: string;
            error_message?: string;
          };
          
          if (step) {
            setSteps(prev => prev.map(s => 
              s.stepNumber === step.step_number
                ? {
                    ...s,
                    status: step.status as PipelineStep["status"],
                    output: step.output_data,
                    visualOutcomeUrl: step.visual_outcome_url,
                    error: step.error_message,
                  }
                : s
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const startPipeline = useCallback(async (
    designImageUrl: string,
    conversationSummary?: string
  ) => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setIsRunning(true);
    setCurrentStep(1);
    setMemory({});

    console.log("Starting pipeline with session:", newSessionId);

    try {
      // Create the project session
      await supabase.from("project_sessions").insert({
        session_id: newSessionId,
        design_image_url: designImageUrl,
        conversation_summary: conversationSummary || null,
      });

      // Initialize all pipeline steps as pending
      const stepsToInsert = PIPELINE_STEPS.map(s => ({
        session_id: newSessionId,
        step_number: s.number,
        step_name: s.name,
        status: "pending",
      }));
      
      await supabase.from("pipeline_steps").insert(stepsToInsert);

      // Start with step 1 - Spatial Analysis
      console.log("Invoking pipeline-spatial-analysis...");
      
      const { data, error } = await supabase.functions.invoke("pipeline-spatial-analysis", {
        body: {
          sessionId: newSessionId,
          designImageUrl,
          conversationSummary,
        },
      });

      if (error) {
        console.error("Pipeline step 1 error:", error);
        throw error;
      }

      console.log("Step 1 completed:", data);
      
      // Update memory with step 1 results
      if (data?.memory) {
        setMemory(prev => ({ ...prev, ...data.memory }));
      }

      // For now, just complete step 1
      // Future steps will be implemented similarly
      setCurrentStep(2);

    } catch (error) {
      console.error("Pipeline error:", error);
      setIsRunning(false);
    }
  }, []);

  const resetPipeline = useCallback(() => {
    setSessionId(null);
    setIsRunning(false);
    setCurrentStep(0);
    setSteps(PIPELINE_STEPS.map(s => ({
      stepNumber: s.number,
      stepName: s.name,
      status: "pending",
    })));
    setMemory({});
  }, []);

  return {
    sessionId,
    isRunning,
    currentStep,
    steps,
    memory,
    startPipeline,
    resetPipeline,
  };
}
