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
    const { sessionId, designImageUrl, conversationSummary } = await req.json();

    if (!sessionId || !designImageUrl) {
      return new Response(
        JSON.stringify({ error: "sessionId and designImageUrl are required" }),
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

    console.log("Starting Spatial Analysis for session:", sessionId);

    // Update step status to processing
    await supabase.from("pipeline_steps").upsert({
      session_id: sessionId,
      step_number: 1,
      step_name: "Spatial Analysis",
      status: "processing",
      started_at: new Date().toISOString(),
      input_data: { designImageUrl, conversationSummary },
    }, { onConflict: "session_id,step_number" });

    // Call Lovable AI for spatial analysis with element extraction
    const analysisPrompt = `You are an expert interior designer and spatial analyst. Analyze this interior design image and provide a comprehensive spatial analysis with element extraction.

${conversationSummary ? `Context from conversation: ${conversationSummary}` : ""}

IMPORTANT: Extract EVERY visible element/object in the image and estimate its position in 3D cartesian coordinates (X, Y, Z) where:
- X = horizontal position (left to right, 0 = left edge, positive = right)
- Y = vertical position (bottom to top, 0 = floor level, positive = up)
- Z = depth position (front to back, 0 = front of room, positive = deeper into room)

Provide your analysis in the following JSON format:
{
  "roomType": "string - type of room (living room, bedroom, etc.)",
  "estimatedDimensions": {
    "length": "number in meters",
    "width": "number in meters",
    "height": "number in meters"
  },
  "elements": [
    {
      "id": "unique identifier (e.g., 'sofa_1', 'lamp_2')",
      "name": "element name (e.g., 'Sectional Sofa', 'Floor Lamp')",
      "category": "furniture|lighting|decor|architectural|textile|plant|electronic|other",
      "position": {
        "x": "number in meters from left wall",
        "y": "number in meters from floor",
        "z": "number in meters from front wall"
      },
      "dimensions": {
        "width": "estimated width in meters",
        "height": "estimated height in meters",
        "depth": "estimated depth in meters"
      },
      "color": "primary color",
      "material": "primary material (wood, fabric, metal, glass, etc.)",
      "condition": "new|good|fair|worn"
    }
  ],
  "zones": [
    {
      "name": "zone name",
      "purpose": "what this area is used for",
      "percentage": "approximate percentage of room"
    }
  ],
  "lightSources": {
    "natural": ["description of natural light sources"],
    "artificial": ["description of artificial light sources"]
  },
  "spatialFlow": "description of how space flows and movement patterns",
  "styleIdentified": "identified interior design style",
  "atmosphereDescription": "description of the overall atmosphere and mood"
}

Be thorough - extract ALL visible elements including furniture, lamps, rugs, plants, artwork, pillows, etc.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: designImageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: `AI analysis failed: ${response.status}`,
        completed_at: new Date().toISOString(),
      }).eq("session_id", sessionId).eq("step_number", 1);

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
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || "";
    
    console.log("Spatial analysis completed:", analysisText.substring(0, 200));

    // Try to parse JSON from response
    let analysisJson = null;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisJson = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Could not parse JSON from response, using raw text");
    }

    const outputData = {
      rawAnalysis: analysisText,
      parsedAnalysis: analysisJson,
      timestamp: new Date().toISOString(),
    };

    const memoryContext = {
      spatialAnalysis: analysisJson || analysisText,
      roomType: analysisJson?.roomType || "unknown",
      styleIdentified: analysisJson?.styleIdentified || "unknown",
    };

    // Update step as completed
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: outputData,
      memory_context: memoryContext,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 1);

    console.log("Spatial Analysis step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        stepNumber: 1,
        stepName: "Spatial Analysis",
        output: outputData,
        memory: memoryContext,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pipeline-spatial-analysis:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
