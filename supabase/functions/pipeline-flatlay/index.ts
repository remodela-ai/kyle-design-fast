import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, elements, roomType, styleIdentified } = await req.json();

    console.log("Starting Material Flatlay generation for session:", sessionId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update step status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 5);

    // Extract materials and colors from elements
    const materials = elements?.map((el: { material?: string }) => el.material).filter(Boolean) || [];
    const colors = elements?.map((el: { color?: string }) => el.color).filter(Boolean) || [];
    const uniqueMaterials = [...new Set(materials)].join(", ") || "wood, fabric, metal, glass";
    const uniqueColors = [...new Set(colors)].join(", ") || "neutral tones";

    const prompt = `Create a professional interior design material flatlay photograph for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style.

The flatlay should be a top-down photograph showing:
- Fabric swatches and textile samples (${uniqueMaterials})
- Wood finish samples and veneer pieces
- Metal hardware samples (handles, knobs, fixtures)
- Stone or tile samples if applicable
- Paint color chips in ${uniqueColors}
- Decorative trim and molding samples
- Leather or upholstery samples
- Glass or acrylic samples if relevant

Arrangement requirements:
- Clean white or light gray background
- Professional overhead flat lay photography style
- Materials arranged in an aesthetically pleasing composition
- Samples slightly overlapping for visual interest
- Natural shadows for depth
- Magazine-quality styling
- High-end interior design presentation

Create a single cohesive flatlay image showing all material samples that would be presented to a client. Ultra high resolution, square 1:1 aspect ratio.`;

    console.log("Calling AI for flatlay generation...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("Flatlay generation completed");

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = aiData.choices?.[0]?.message?.content || "Material flatlay generated successfully";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    // Update pipeline step with results
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: {
        flatlayUrl: imageUrl,
        description,
        materials: uniqueMaterials,
        colors: uniqueColors,
      },
      visual_outcome_url: imageUrl,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 5);

    console.log("Material Flatlay step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description,
        output: {
          flatlayUrl: imageUrl,
          description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Material Flatlay error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
