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

export interface ArchitecturalPlans {
  floorPlan?: string;
  elevationView?: string;
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
  const [architecturalPlans, setArchitecturalPlans] = useState<ArchitecturalPlans>({});

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

  // Run Step 2: Architectural Plans (nano-planta + nano-elevacion)
  const runArchitecturalPlans = useCallback(async (
    currentSessionId: string,
    spatialAnalysis: Record<string, unknown>,
    roomType: string,
    elements: unknown[]
  ) => {
    console.log("Starting Step 2: Architectural Plans");
    
    // Update step 2 status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", currentSessionId).eq("step_number", 2);

    setSteps(prev => prev.map(s => 
      s.stepNumber === 2 ? { ...s, status: "processing" } : s
    ));

    try {
      // Run both nano functions in parallel
      const [plantaResult, elevacionResult] = await Promise.all([
        supabase.functions.invoke("nano-planta", {
          body: { sessionId: currentSessionId, spatialAnalysis, roomType, elements },
        }),
        supabase.functions.invoke("nano-elevacion", {
          body: { sessionId: currentSessionId, spatialAnalysis, roomType, elements },
        }),
      ]);

      console.log("Floor plan result:", plantaResult);
      console.log("Elevation result:", elevacionResult);

      const floorPlanUrl = plantaResult.data?.imageUrl;
      const elevationUrl = elevacionResult.data?.imageUrl;

      setArchitecturalPlans({
        floorPlan: floorPlanUrl,
        elevationView: elevationUrl,
      });

      // Update step 2 as completed
      await supabase.from("pipeline_steps").update({
        status: "completed",
        output_data: {
          floorPlanUrl,
          elevationUrl,
          floorPlanDescription: plantaResult.data?.description,
          elevationDescription: elevacionResult.data?.description,
        },
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 2);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 2 
          ? { 
              ...s, 
              status: "completed",
              output: { floorPlanUrl, elevationUrl },
            } 
          : s
      ));

      setCurrentStep(3);
      console.log("Step 2 completed successfully");

    } catch (error) {
      console.error("Error in Step 2:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 2);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 2 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, []);

  const startPipeline = useCallback(async (
    designImageUrl: string,
    conversationSummary?: string
  ) => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setIsRunning(true);
    setCurrentStep(1);
    setMemory({});
    setArchitecturalPlans({});

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
      const spatialAnalysis = data?.output?.parsedAnalysis || data?.memory?.spatialAnalysis;
      const roomType = spatialAnalysis?.roomType || data?.memory?.roomType || "room";
      const elements = spatialAnalysis?.elements || [];

      if (data?.memory) {
        setMemory(prev => ({ ...prev, ...data.memory }));
      }

      setCurrentStep(2);

      // Automatically proceed to Step 2: Architectural Plans
      if (spatialAnalysis) {
        await runArchitecturalPlans(newSessionId, spatialAnalysis, roomType, elements);
      }

    } catch (error) {
      console.error("Pipeline error:", error);
      setIsRunning(false);
    }
  }, [runArchitecturalPlans]);

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
    setArchitecturalPlans({});
  }, []);

  return {
    sessionId,
    isRunning,
    currentStep,
    steps,
    memory,
    architecturalPlans,
    startPipeline,
    resetPipeline,
  };
}
