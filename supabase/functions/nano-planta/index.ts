import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, spatialAnalysis, roomType, elements } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Generating Floor Plan for session:", sessionId);

    // Build elements list for the prompt
    const elementsList = elements?.map((el: { name: string; dimensions?: { width: number; depth: number } }) => 
      `- ${el.name}: ${el.dimensions?.width || 1}m x ${el.dimensions?.depth || 1}m`
    ).join('\n') || '';

    // Build prompt for floor plan generation
    const floorPlanPrompt = `Generate a professional architectural floor plan (top-down view) for a ${roomType || 'room'}.

Room specifications:
${spatialAnalysis?.estimatedDimensions ? `- Room dimensions: ${spatialAnalysis.estimatedDimensions.length}m x ${spatialAnalysis.estimatedDimensions.width}m` : '- Standard room size'}
${spatialAnalysis?.styleIdentified ? `- Style: ${spatialAnalysis.styleIdentified}` : ''}

Elements to include with their approximate sizes:
${elementsList || '- Standard furniture layout'}

Requirements:
- Clean, professional architectural drawing style
- Black lines on white background
- Top-down orthographic view
- Show furniture placement with proper scale
- Include dimension lines
- Label key elements
- Show doors and windows if applicable
- Use standard architectural symbols`;

    console.log("Floor plan prompt:", floorPlanPrompt);

    // Call Lovable AI with Nano Banana for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: floorPlanPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Nano Banana response received");

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      console.error("No image generated, response:", JSON.stringify(data));
      throw new Error("No floor plan image was generated");
    }

    console.log("Floor plan generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: textResponse,
        type: "floor_plan",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nano-planta:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
