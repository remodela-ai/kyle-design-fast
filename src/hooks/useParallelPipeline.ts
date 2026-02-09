import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PipelineStep {
  stepNumber: number;
  stepName: string;
  status: "pending" | "processing" | "completed" | "error";
  output?: Record<string, unknown>;
  visualOutcomeUrl?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ParallelPipelineState {
  sessionId: string | null;
  isRunning: boolean;
  steps: PipelineStep[];
  managementSteps: PipelineStep[];
  pipelineComplete: boolean;
  managementComplete: boolean;
  spatialData: SpatialData | null;
  startTime: Date | null;
  estimatedCompletion: number | null; // seconds remaining
}

interface SpatialData {
  elements: unknown[];
  roomType: string;
  styleIdentified: string;
  parsedAnalysis: Record<string, unknown>;
}

const VISUAL_STEPS = [
  { number: 1, name: "Spatial Analysis", fn: "pipeline-spatial-analysis" },
  { number: 2, name: "Architectural Plans", fn: "nano-planta" },
  { number: 3, name: "Items Extraction", fn: "pipeline-items-extraction" },
  { number: 4, name: "Design Moodboard", fn: "pipeline-moodboard" },
  { number: 5, name: "Material Flatlay", fn: "pipeline-flatlay" },
  { number: 6, name: "Colors & Textures", fn: "pipeline-colors-textures" },
  { number: 7, name: "Your Story Book", fn: "pipeline-storybook" },
  { number: 8, name: "Video Presentation", fn: "pipeline-video-presentation" },
];

const MANAGEMENT_STEPS = [
  { number: 9, name: "Proposal & Budget", fn: "management-proposal-budget" },
  { number: 10, name: "Bill of Materials", fn: "management-bom" },
  { number: 11, name: "Project Timeline", fn: "management-timeline" },
  { number: 12, name: "Technical Specs", fn: "management-specs" },
  { number: 13, name: "Supplier Directory", fn: "management-suppliers" },
  { number: 14, name: "Installation Plan", fn: "management-installation" },
  { number: 15, name: "Delivery Checklist", fn: "management-checklist" },
  { number: 16, name: "Project Cover", fn: "management-cover" },
];

export function useParallelPipeline() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [spatialData, setSpatialData] = useState<SpatialData | null>(null);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [managementComplete, setManagementComplete] = useState(false);

  const [steps, setSteps] = useState<PipelineStep[]>(
    VISUAL_STEPS.map((s) => ({
      stepNumber: s.number,
      stepName: s.name,
      status: "pending",
    }))
  );

  const [managementSteps, setManagementSteps] = useState<PipelineStep[]>(
    MANAGEMENT_STEPS.map((s) => ({
      stepNumber: s.number,
      stepName: s.name,
      status: "pending",
    }))
  );

  // Calculate ETA based on processing steps
  const estimatedCompletion = useCallback(() => {
    if (!startTime || !isRunning) return null;
    const elapsed = (Date.now() - startTime.getTime()) / 1000;
    const completedCount = steps.filter((s) => s.status === "completed").length;
    const processingCount = steps.filter((s) => s.status === "processing").length;

    if (completedCount === 0 && processingCount > 0) {
      // Step 1 is processing, estimate ~50s total
      return Math.max(0, 85 - elapsed);
    }

    if (completedCount === 1 && processingCount > 0) {
      // Parallel batch processing, estimate ~35s more
      return Math.max(0, 35 - (elapsed - 50));
    }

    return null;
  }, [startTime, isRunning, steps]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`parallel-pipeline-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pipeline_steps",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const step = payload.new as {
            step_number: number;
            status: string;
            output_data?: Record<string, unknown>;
            visual_outcome_url?: string;
            error_message?: string;
          };

          if (step) {
            const updateFn = (prev: PipelineStep[]) =>
              prev.map((s) =>
                s.stepNumber === step.step_number
                  ? {
                      ...s,
                      status: step.status as PipelineStep["status"],
                      output: step.output_data,
                      visualOutcomeUrl: step.visual_outcome_url,
                      error: step.error_message,
                    }
                  : s
              );

            if (step.step_number <= 8) {
              setSteps(updateFn);
            } else {
              setManagementSteps(updateFn);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Run a single step and return result
  const runStep = useCallback(
    async (
      stepNumber: number,
      functionName: string,
      currentSessionId: string,
      payload: Record<string, unknown>
    ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
      const updateFn = (prev: PipelineStep[]) =>
        prev.map((s) =>
          s.stepNumber === stepNumber
            ? { ...s, status: "processing" as const, startedAt: new Date() }
            : s
        );

      if (stepNumber <= 8) {
        setSteps(updateFn);
      } else {
        setManagementSteps(updateFn);
      }

      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { sessionId: currentSessionId, ...payload },
        });

        if (error) throw error;

        const successUpdate = (prev: PipelineStep[]) =>
          prev.map((s) =>
            s.stepNumber === stepNumber
              ? {
                  ...s,
                  status: "completed" as const,
                  output: data,
                  visualOutcomeUrl: data?.imageUrl,
                  completedAt: new Date(),
                }
              : s
          );

        if (stepNumber <= 8) {
          setSteps(successUpdate);
        } else {
          setManagementSteps(successUpdate);
        }

        return { success: true, data };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        const errorUpdate = (prev: PipelineStep[]) =>
          prev.map((s) =>
            s.stepNumber === stepNumber
              ? { ...s, status: "error" as const, error: errorMsg }
              : s
          );

        if (stepNumber <= 8) {
          setSteps(errorUpdate);
        } else {
          setManagementSteps(errorUpdate);
        }

        return { success: false, error: errorMsg };
      }
    },
    []
  );

  // Start the parallel pipeline
  const startPipeline = useCallback(
    async (
      designImageUrl: string,
      conversationSummary?: string,
      designerId?: string,
      leadId?: string
    ) => {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      setIsRunning(true);
      setStartTime(new Date());
      setPipelineComplete(false);
      setManagementComplete(false);

      console.log("🚀 Starting PARALLEL pipeline with session:", newSessionId);

      try {
        // Create the project session
        await supabase.from("project_sessions").insert({
          session_id: newSessionId,
          design_image_url: designImageUrl,
          conversation_summary: conversationSummary || null,
          designer_id: designerId || null,
          lead_id: leadId || null,
        });

        // Initialize all pipeline steps
        const allSteps = [...VISUAL_STEPS, ...MANAGEMENT_STEPS].map((s) => ({
          session_id: newSessionId,
          step_number: s.number,
          step_name: s.name,
          status: "pending",
        }));

        await supabase.from("pipeline_steps").insert(allSteps);

        // STEP 1: Spatial Analysis (blocking - others depend on it)
        console.log("📊 Step 1: Spatial Analysis (blocking)...");
        const step1Result = await runStep(1, "pipeline-spatial-analysis", newSessionId, {
          designImageUrl,
          conversationSummary,
        });

        if (!step1Result.success || !step1Result.data) {
          console.error("Step 1 failed, cannot continue");
          setIsRunning(false);
          return;
        }

        // Extract spatial data for parallel steps
        const spatialOutput = step1Result.data as {
          output?: { parsedAnalysis?: Record<string, unknown> };
          memory?: Record<string, unknown>;
        };
        const parsedAnalysis =
          spatialOutput?.output?.parsedAnalysis ||
          spatialOutput?.memory?.spatialAnalysis ||
          {};
        const elements = (parsedAnalysis as { elements?: unknown[] })?.elements || [];
        const roomType =
          (parsedAnalysis as { roomType?: string })?.roomType ||
          (spatialOutput?.memory?.roomType as string) ||
          "room";
        const styleIdentified =
          (parsedAnalysis as { styleIdentified?: string })?.styleIdentified ||
          (spatialOutput?.memory?.styleIdentified as string) ||
          "modern";

        setSpatialData({
          elements,
          roomType,
          styleIdentified,
          parsedAnalysis: parsedAnalysis as Record<string, unknown>,
        });

        console.log("✅ Step 1 complete. Starting parallel batch (Steps 2-8)...");

        // PARALLEL BATCH: Steps 2-8 (all depend only on Step 1)
        const parallelPromises = [
          // Step 2: Architectural Plans (nano-planta + nano-elevacion in parallel)
          (async () => {
            setSteps((prev) =>
              prev.map((s) =>
                s.stepNumber === 2 ? { ...s, status: "processing" as const } : s
              )
            );
            try {
              const [plantaRes, elevacionRes] = await Promise.all([
                supabase.functions.invoke("nano-planta", {
                  body: {
                    sessionId: newSessionId,
                    spatialAnalysis: parsedAnalysis,
                    roomType,
                    elements,
                  },
                }),
                supabase.functions.invoke("nano-elevacion", {
                  body: {
                    sessionId: newSessionId,
                    spatialAnalysis: parsedAnalysis,
                    roomType,
                    elements,
                  },
                }),
              ]);

              setSteps((prev) =>
                prev.map((s) =>
                  s.stepNumber === 2
                    ? {
                        ...s,
                        status: "completed" as const,
                        output: {
                          floorPlanUrl: plantaRes.data?.imageUrl,
                          elevationUrl: elevacionRes.data?.imageUrl,
                        },
                        visualOutcomeUrl: plantaRes.data?.imageUrl,
                      }
                    : s
                )
              );
              return { step: 2, success: true };
            } catch (err) {
              setSteps((prev) =>
                prev.map((s) =>
                  s.stepNumber === 2
                    ? {
                        ...s,
                        status: "error" as const,
                        error: err instanceof Error ? err.message : "Unknown",
                      }
                    : s
                )
              );
              return { step: 2, success: false };
            }
          })(),

          // Step 3: Items Extraction
          runStep(3, "pipeline-items-extraction", newSessionId, {
            elements,
            roomType,
            styleIdentified,
          }),

          // Step 4: Moodboard
          runStep(4, "pipeline-moodboard", newSessionId, {
            elements,
            roomType,
            styleIdentified,
            designImageUrl,
          }),

          // Step 5: Flatlay
          runStep(5, "pipeline-flatlay", newSessionId, {
            elements,
            roomType,
            styleIdentified,
          }),

          // Step 6: Colors & Textures
          runStep(6, "pipeline-colors-textures", newSessionId, {
            elements,
            roomType,
            styleIdentified,
          }),

          // Step 7: Storybook
          runStep(7, "pipeline-storybook", newSessionId, {
            elements,
            roomType,
            styleIdentified,
            conversationSummary,
          }),

          // Step 8: Video Presentation
          runStep(8, "pipeline-video-presentation", newSessionId, {
            elements,
            roomType,
            styleIdentified,
            conversationSummary,
          }),
        ];

        // Wait for ALL parallel steps (don't fail fast)
        const results = await Promise.allSettled(parallelPromises);
        console.log("✅ Visual pipeline complete. Results:", results);

        setPipelineComplete(true);

        // Get items extraction for budget
        const itemsStep = steps.find((s) => s.stepNumber === 3);
        const totalBudget = (itemsStep?.output as { totalEstimatedBudget?: { min: number; max: number; currency: string } })
          ?.totalEstimatedBudget;

        // Start MANAGEMENT pipeline in parallel
        console.log("📋 Starting parallel management batch (Steps 9-16)...");

        const managementPromises = MANAGEMENT_STEPS.map((step) =>
          runStep(step.number, step.fn, newSessionId, {
            elements,
            roomType,
            styleIdentified,
            totalBudget,
            conversationSummary,
          })
        );

        await Promise.allSettled(managementPromises);
        console.log("🎉 FULL PIPELINE COMPLETE!");

        setManagementComplete(true);
        setIsRunning(false);
      } catch (error) {
        console.error("Pipeline error:", error);
        setIsRunning(false);
      }
    },
    [runStep, steps]
  );

  // Reset everything
  const resetPipeline = useCallback(() => {
    setSessionId(null);
    setIsRunning(false);
    setStartTime(null);
    setSpatialData(null);
    setPipelineComplete(false);
    setManagementComplete(false);
    setSteps(
      VISUAL_STEPS.map((s) => ({
        stepNumber: s.number,
        stepName: s.name,
        status: "pending",
      }))
    );
    setManagementSteps(
      MANAGEMENT_STEPS.map((s) => ({
        stepNumber: s.number,
        stepName: s.name,
        status: "pending",
      }))
    );
  }, []);

  return {
    sessionId,
    isRunning,
    steps,
    managementSteps,
    pipelineComplete,
    managementComplete,
    spatialData,
    startTime,
    estimatedCompletion: estimatedCompletion(),
    startPipeline,
    resetPipeline,
  };
}
