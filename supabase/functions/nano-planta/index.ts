import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, spatialAnalysis, roomType, elements, referenceImage } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    console.log("Generating Floor Plan for session:", sessionId);

    const elementsList = elements?.map((el: { name: string; dimensions?: { width: number; depth: number } }) => 
      `- ${el.name}: ${el.dimensions?.width || 1}m x ${el.dimensions?.depth || 1}m`
    ).join('\n') || '';

    const floorPlanPrompt = `Professional architectural floor plan, top-down orthographic view for a ${roomType || 'room'}. ${spatialAnalysis?.estimatedDimensions ? `Room dimensions: ${spatialAnalysis.estimatedDimensions.length}m x ${spatialAnalysis.estimatedDimensions.width}m.` : 'Standard room size.'} ${spatialAnalysis?.styleIdentified ? `${spatialAnalysis.styleIdentified} style.` : ''} Elements: ${elementsList || 'Standard furniture layout'}. Clean architectural drawing, black lines on white background, furniture placement with proper scale, dimension lines, labeled elements, doors and windows, standard architectural symbols. Technical blueprint quality.`;

    console.log("Floor plan prompt:", floorPlanPrompt.substring(0, 200) + "...");

    const input: Record<string, unknown> = {
      prompt: floorPlanPrompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.3;
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No floor plan image was generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    console.log("Floor plan generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: "Architectural floor plan generated with Flux 2 Pro",
        type: "floor_plan",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nano-planta:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage.includes("payment") || errorMessage.includes("402")) {
      return new Response(
        JSON.stringify({ error: "Payment required, please add funds." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
