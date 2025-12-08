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
    const { sessionId, elements, roomType, styleIdentified, designImageUrl } = await req.json();

    console.log("Starting Design Moodboard generation for session:", sessionId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update step status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 4);

    // Build detailed prompt for moodboard
    const elementsList = elements?.map((el: { name: string; material?: string; color?: string }) => 
      `${el.name} (${el.material || 'standard'}, ${el.color || 'neutral'})`
    ).join(", ") || "various furniture and decor items";

    const prompt = `Create a professional interior design moodboard collage for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style.

The moodboard should include:
- Color palette swatches showing harmonious colors
- Material and texture samples (fabrics, wood, metals, stones)
- Key furniture silhouettes inspired by: ${elementsList}
- Decorative elements and accessories
- Lighting fixtures suggestions
- Plants and greenery elements
- Inspirational lifestyle imagery

Style requirements:
- Clean, editorial magazine layout
- Professional design presentation
- Cohesive aesthetic throughout
- High-end interior design studio quality
- Elegant typography for section labels
- White or neutral background for clean presentation

Create a single cohesive moodboard image that a client would receive from a professional interior designer. Ultra high resolution, 16:9 aspect ratio.`;

    console.log("Calling AI for moodboard generation...");

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
    console.log("Moodboard generation completed");

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = aiData.choices?.[0]?.message?.content || "Design moodboard generated successfully";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    // Update pipeline step with results
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: {
        moodboardUrl: imageUrl,
        description,
        roomType,
        styleIdentified,
      },
      visual_outcome_url: imageUrl,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 4);

    console.log("Design Moodboard step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description,
        output: {
          moodboardUrl: imageUrl,
          description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Design Moodboard error:", error);
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
