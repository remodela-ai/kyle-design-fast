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

export interface ShoppingItem {
  originalName: string;
  productName: string;
  category: string;
  estimatedPriceRange: {
    min: number;
    max: number;
    currency: string;
  };
  searchKeywords: string[];
  suggestedRetailers: string[];
  shoppingUrl: string;
  description: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  material?: string;
  color?: string;
}

export interface ItemsExtraction {
  items: ShoppingItem[];
  totalEstimatedBudget?: {
    min: number;
    max: number;
    currency: string;
  };
  shoppingTips?: string[];
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
  const [itemsExtraction, setItemsExtraction] = useState<ItemsExtraction>({ items: [] });
  const [moodboardUrl, setMoodboardUrl] = useState<string | null>(null);
  const [flatlayUrl, setFlatlayUrl] = useState<string | null>(null);
  const [colorsTexturesUrl, setColorsTexturesUrl] = useState<string | null>(null);
  const [storybookUrl, setStorybookUrl] = useState<string | null>(null);
  const [videoPresentationUrl, setVideoPresentationUrl] = useState<string | null>(null);
  const [pipelineComplete, setPipelineComplete] = useState(false);

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

  // Run Step 8: Video Presentation
  const runVideoPresentation = useCallback(async (
    currentSessionId: string,
    elements: unknown[],
    roomType: string,
    styleIdentified: string,
    conversationSummary?: string
  ) => {
    console.log("Starting Step 8: Video Presentation");
    
    setSteps(prev => prev.map(s => 
      s.stepNumber === 8 ? { ...s, status: "processing" } : s
    ));

    try {
      const { data, error } = await supabase.functions.invoke("pipeline-video-presentation", {
        body: { sessionId: currentSessionId, elements, roomType, styleIdentified, conversationSummary },
      });

      if (error) {
        console.error("Video Presentation generation error:", error);
        throw error;
      }

      console.log("Video Presentation result:", data);

      const generatedVideoPresentationUrl = data?.imageUrl;
      setVideoPresentationUrl(generatedVideoPresentationUrl);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 8 
          ? { 
              ...s, 
              status: "completed",
              output: { videoPresentationUrl: generatedVideoPresentationUrl },
              visualOutcomeUrl: generatedVideoPresentationUrl,
            } 
          : s
      ));

      setPipelineComplete(true);
      console.log("Step 8 completed successfully");
      console.log("🎉 PIPELINE COMPLETE!");

    } catch (error) {
      console.error("Error in Step 8:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 8);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 8 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, []);

  // Run Step 7: Your Story Book
  const runStorybook = useCallback(async (
    currentSessionId: string,
    elements: unknown[],
    roomType: string,
    styleIdentified: string,
    conversationSummary?: string
  ) => {
    console.log("Starting Step 7: Your Story Book");
    
    setSteps(prev => prev.map(s => 
      s.stepNumber === 7 ? { ...s, status: "processing" } : s
    ));

    try {
      const { data, error } = await supabase.functions.invoke("pipeline-storybook", {
        body: { sessionId: currentSessionId, elements, roomType, styleIdentified, conversationSummary },
      });

      if (error) {
        console.error("Storybook generation error:", error);
        throw error;
      }

      console.log("Storybook result:", data);

      const generatedStorybookUrl = data?.imageUrl;
      setStorybookUrl(generatedStorybookUrl);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 7 
          ? { 
              ...s, 
              status: "completed",
              output: { storybookUrl: generatedStorybookUrl },
              visualOutcomeUrl: generatedStorybookUrl,
            } 
          : s
      ));

      setCurrentStep(8);
      console.log("Step 7 completed successfully");

      // Automatically proceed to Step 8: Video Presentation
      await runVideoPresentation(currentSessionId, elements, roomType, styleIdentified, conversationSummary);

    } catch (error) {
      console.error("Error in Step 7:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 7);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 7 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, [runVideoPresentation]);

  // Run Step 6: Colors & Textures
  const runColorsTextures = useCallback(async (
    currentSessionId: string,
    elements: unknown[],
    roomType: string,
    styleIdentified: string,
    conversationSummary?: string
  ) => {
    console.log("Starting Step 6: Colors & Textures");
    
    setSteps(prev => prev.map(s => 
      s.stepNumber === 6 ? { ...s, status: "processing" } : s
    ));

    try {
      const { data, error } = await supabase.functions.invoke("pipeline-colors-textures", {
        body: { sessionId: currentSessionId, elements, roomType, styleIdentified },
      });

      if (error) {
        console.error("Colors & Textures generation error:", error);
        throw error;
      }

      console.log("Colors & Textures result:", data);

      const generatedColorsTexturesUrl = data?.imageUrl;
      setColorsTexturesUrl(generatedColorsTexturesUrl);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 6 
          ? { 
              ...s, 
              status: "completed",
              output: { colorsTexturesUrl: generatedColorsTexturesUrl },
              visualOutcomeUrl: generatedColorsTexturesUrl,
            } 
          : s
      ));

      setCurrentStep(7);
      console.log("Step 6 completed successfully");

      // Automatically proceed to Step 7: Your Story Book
      await runStorybook(currentSessionId, elements, roomType, styleIdentified, conversationSummary);

    } catch (error) {
      console.error("Error in Step 6:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 6);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 6 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, [runStorybook]);

  // Run Step 5: Material Flatlay
  const runFlatlay = useCallback(async (
    currentSessionId: string,
    elements: unknown[],
    roomType: string,
    styleIdentified: string,
    conversationSummary?: string
  ) => {
    console.log("Starting Step 5: Material Flatlay");
    
    setSteps(prev => prev.map(s => 
      s.stepNumber === 5 ? { ...s, status: "processing" } : s
    ));

    try {
      const { data, error } = await supabase.functions.invoke("pipeline-flatlay", {
        body: { sessionId: currentSessionId, elements, roomType, styleIdentified },
      });

      if (error) {
        console.error("Flatlay generation error:", error);
        throw error;
      }

      console.log("Flatlay result:", data);

      const generatedFlatlayUrl = data?.imageUrl;
      setFlatlayUrl(generatedFlatlayUrl);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 5 
          ? { 
              ...s, 
              status: "completed",
              output: { flatlayUrl: generatedFlatlayUrl },
              visualOutcomeUrl: generatedFlatlayUrl,
            } 
          : s
      ));

      setCurrentStep(6);
      console.log("Step 5 completed successfully");

      // Automatically proceed to Step 6: Colors & Textures
      await runColorsTextures(currentSessionId, elements, roomType, styleIdentified, conversationSummary);

    } catch (error) {
      console.error("Error in Step 5:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 5);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 5 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, [runColorsTextures]);

  // Run Step 4: Design Moodboard
  const runMoodboard = useCallback(async (
    currentSessionId: string,
    elements: unknown[],
    roomType: string,
    styleIdentified: string,
    designImageUrl?: string,
    conversationSummary?: string
  ) => {
    console.log("Starting Step 4: Design Moodboard");
    
    setSteps(prev => prev.map(s => 
      s.stepNumber === 4 ? { ...s, status: "processing" } : s
    ));

    try {
      const { data, error } = await supabase.functions.invoke("pipeline-moodboard", {
        body: { sessionId: currentSessionId, elements, roomType, styleIdentified, designImageUrl },
      });

      if (error) {
        console.error("Moodboard generation error:", error);
        throw error;
      }

      console.log("Moodboard result:", data);

      const generatedMoodboardUrl = data?.imageUrl;
      setMoodboardUrl(generatedMoodboardUrl);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 4 
          ? { 
              ...s, 
              status: "completed",
              output: { moodboardUrl: generatedMoodboardUrl },
              visualOutcomeUrl: generatedMoodboardUrl,
            } 
          : s
      ));

      setCurrentStep(5);
      console.log("Step 4 completed successfully");

      // Automatically proceed to Step 5: Material Flatlay
      await runFlatlay(currentSessionId, elements, roomType, styleIdentified, conversationSummary);

    } catch (error) {
      console.error("Error in Step 4:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 4);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 4 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, [runFlatlay]);

  // Run Step 3: Items Extraction
  const runItemsExtraction = useCallback(async (
    currentSessionId: string,
    elements: unknown[],
    roomType: string,
    styleIdentified: string,
    designImageUrl?: string,
    conversationSummary?: string
  ) => {
    console.log("Starting Step 3: Items Extraction");
    
    setSteps(prev => prev.map(s => 
      s.stepNumber === 3 ? { ...s, status: "processing" } : s
    ));

    try {
      const { data, error } = await supabase.functions.invoke("pipeline-items-extraction", {
        body: { sessionId: currentSessionId, elements, roomType, styleIdentified },
      });

      if (error) {
        console.error("Items extraction error:", error);
        throw error;
      }

      console.log("Items extraction result:", data);

      const items = data?.output?.items || [];
      const totalBudget = data?.output?.totalEstimatedBudget;
      const tips = data?.output?.shoppingTips || [];

      setItemsExtraction({
        items,
        totalEstimatedBudget: totalBudget,
        shoppingTips: tips,
      });

      setSteps(prev => prev.map(s => 
        s.stepNumber === 3 
          ? { 
              ...s, 
              status: "completed",
              output: { items, totalEstimatedBudget: totalBudget, shoppingTips: tips },
            } 
          : s
      ));

      setCurrentStep(4);
      console.log("Step 3 completed successfully");

      // Automatically proceed to Step 4: Design Moodboard
      await runMoodboard(currentSessionId, elements, roomType, styleIdentified, designImageUrl, conversationSummary);

    } catch (error) {
      console.error("Error in Step 3:", error);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }).eq("session_id", currentSessionId).eq("step_number", 3);

      setSteps(prev => prev.map(s => 
        s.stepNumber === 3 
          ? { ...s, status: "error", error: error instanceof Error ? error.message : "Unknown error" } 
          : s
      ));
    }
  }, [runMoodboard]);

  // Run Step 2: Architectural Plans (nano-planta + nano-elevacion)
  const runArchitecturalPlans = useCallback(async (
    currentSessionId: string,
    spatialAnalysis: Record<string, unknown>,
    roomType: string,
    elements: unknown[],
    styleIdentified: string,
    designImageUrl?: string,
    conversationSummary?: string
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

      // Automatically proceed to Step 3: Items Extraction
      await runItemsExtraction(currentSessionId, elements, roomType, styleIdentified, designImageUrl, conversationSummary);

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
  }, [runItemsExtraction]);

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
    setItemsExtraction({ items: [] });

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
      const styleIdentified = spatialAnalysis?.styleIdentified || data?.memory?.styleIdentified || "modern";
      const elements = spatialAnalysis?.elements || [];

      if (data?.memory) {
        setMemory(prev => ({ ...prev, ...data.memory }));
      }

      setCurrentStep(2);

      // Automatically proceed to Step 2: Architectural Plans
      if (spatialAnalysis) {
        await runArchitecturalPlans(newSessionId, spatialAnalysis, roomType, elements, styleIdentified, designImageUrl, conversationSummary);
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
    setItemsExtraction({ items: [] });
    setMoodboardUrl(null);
    setFlatlayUrl(null);
    setColorsTexturesUrl(null);
    setStorybookUrl(null);
    setVideoPresentationUrl(null);
    setPipelineComplete(false);
  }, []);

  return {
    sessionId,
    isRunning,
    currentStep,
    steps,
    memory,
    architecturalPlans,
    itemsExtraction,
    moodboardUrl,
    flatlayUrl,
    colorsTexturesUrl,
    storybookUrl,
    videoPresentationUrl,
    pipelineComplete,
    startPipeline,
    resetPipeline,
  };
}
