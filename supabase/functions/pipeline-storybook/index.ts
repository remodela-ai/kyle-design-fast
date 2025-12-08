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
    const { sessionId, elements, roomType, styleIdentified, conversationSummary } = await req.json();

    console.log("Starting Story Book generation for session:", sessionId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update step status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 7);

    // Build context from elements
    const elementNames = elements?.map((el: { name: string }) => el.name).join(", ") || "furniture and decor";
    const materials = elements?.map((el: { material?: string }) => el.material).filter(Boolean);
    const uniqueMaterials = [...new Set(materials)].join(", ") || "natural materials";

    const prompt = `Create a professional interior design storybook presentation page for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style.

Design concept brief: ${conversationSummary || 'A sophisticated and welcoming interior space'}

The storybook page should be a beautiful editorial layout featuring:

HEADER SECTION:
- Elegant title: "Your Design Story"
- Subtitle with the room type and style
- Decorative divider or border element

NARRATIVE SECTION:
- A poetic description of the space's atmosphere
- The design inspiration and philosophy
- How the space will feel to live in
- The story behind the material and color choices

VISUAL ELEMENTS:
- Artistic vignette illustrations of key design moments
- Decorative botanical or geometric borders
- Elegant typography with serif fonts for headings
- Script or handwritten accents for quotes

KEY FEATURES HIGHLIGHTED:
- Featured elements: ${elementNames}
- Material story: ${uniqueMaterials}
- The emotional journey of the space

DESIGN STYLE:
- Magazine editorial quality
- Coffee table book aesthetic
- Warm, inviting presentation
- Professional interior design portfolio style
- Cream or soft white background
- Gold or copper accent details

Create a single beautiful storybook page that tells the narrative of this interior design project. Ultra high resolution, portrait 3:4 aspect ratio.`;

    console.log("Calling AI for storybook generation...");

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
    console.log("Story Book generation completed");

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = aiData.choices?.[0]?.message?.content || "Story Book generated successfully";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    // Update pipeline step with results
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: {
        storybookUrl: imageUrl,
        description,
        roomType,
        styleIdentified,
      },
      visual_outcome_url: imageUrl,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 7);

    console.log("Story Book step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description,
        output: {
          storybookUrl: imageUrl,
          description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Story Book error:", error);
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
