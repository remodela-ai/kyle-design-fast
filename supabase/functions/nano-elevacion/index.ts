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

    console.log("Generating Elevation View for session:", sessionId);

    const elementsList = elements?.map((el: { name: string; dimensions?: { width: number; height: number } }) => 
      `- ${el.name}: ${el.dimensions?.width || 1}m wide x ${el.dimensions?.height || 1}m tall`
    ).join('\n') || '';

    const elevationPrompt = `Professional architectural elevation view, front-facing orthographic view for a ${roomType || 'room'}. ${spatialAnalysis?.estimatedDimensions ? `Room dimensions: ${spatialAnalysis.estimatedDimensions.width}m wide x ${spatialAnalysis.estimatedDimensions.height}m tall.` : 'Standard room size.'} ${spatialAnalysis?.styleIdentified ? `${spatialAnalysis.styleIdentified} style.` : ''} Elements with heights: ${elementsList || 'Standard furniture arrangement'}. Clean architectural elevation drawing, black lines on white background, furniture silhouettes with proper heights, dimension lines, labeled elements, windows doors and wall features, standard architectural elevation symbols, ceiling height reference. Technical blueprint quality.`;

    console.log("Elevation prompt:", elevationPrompt.substring(0, 200) + "...");

    const input: Record<string, unknown> = {
      prompt: elevationPrompt,
      aspect_ratio: "16:9",
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
      throw new Error("No elevation view image was generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    console.log("Elevation view generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: "Architectural elevation view generated with Flux 2 Pro",
        type: "elevation_view",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nano-elevacion:", error);
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
