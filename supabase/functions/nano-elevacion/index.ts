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

    console.log("Generating Elevation View for session:", sessionId);

    // Build elements list for the prompt
    const elementsList = elements?.map((el: { name: string; dimensions?: { width: number; height: number } }) => 
      `- ${el.name}: ${el.dimensions?.width || 1}m wide x ${el.dimensions?.height || 1}m tall`
    ).join('\n') || '';

    // Build prompt for elevation view generation
    const elevationPrompt = `Generate a professional architectural elevation view (front/side view) for a ${roomType || 'room'}.

Room specifications:
${spatialAnalysis?.estimatedDimensions ? `- Room dimensions: ${spatialAnalysis.estimatedDimensions.width}m wide x ${spatialAnalysis.estimatedDimensions.height}m tall` : '- Standard room size'}
${spatialAnalysis?.styleIdentified ? `- Style: ${spatialAnalysis.styleIdentified}` : ''}

Elements to include with their heights:
${elementsList || '- Standard furniture arrangement'}

Requirements:
- Clean, professional architectural elevation drawing
- Black lines on white background
- Front-facing orthographic view showing wall elevation
- Show furniture silhouettes with proper heights
- Include dimension lines for heights
- Label key elements
- Show windows, doors, and wall features
- Use standard architectural elevation symbols
- Show ceiling height reference`;

    console.log("Elevation prompt:", elevationPrompt);

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
            content: elevationPrompt,
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
      throw new Error("No elevation view image was generated");
    }

    console.log("Elevation view generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: textResponse,
        type: "elevation_view",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nano-elevacion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
