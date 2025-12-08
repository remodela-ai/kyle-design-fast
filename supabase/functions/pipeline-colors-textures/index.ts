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

    console.log("Starting Colors & Textures generation for session:", sessionId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update step status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 6);

    // Extract colors from elements
    const colors = elements?.map((el: { color?: string }) => el.color).filter(Boolean) || [];
    const materials = elements?.map((el: { material?: string }) => el.material).filter(Boolean) || [];
    const uniqueColors = [...new Set(colors)].join(", ") || "warm neutrals, soft grays, accent tones";
    const uniqueMaterials = [...new Set(materials)].join(", ") || "wood, fabric, metal";

    const prompt = `Create a professional interior design color and texture palette board for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style.

The palette board should include:

COLOR SECTION:
- Primary color swatches (large rectangles) showing dominant colors: ${uniqueColors}
- Secondary accent colors (medium rectangles)
- Tertiary/neutral colors (smaller swatches)
- Color harmony diagram showing relationships
- HEX/RGB color codes displayed elegantly

TEXTURE SECTION:
- Close-up texture samples for: ${uniqueMaterials}
- Fabric weave patterns and textile textures
- Wood grain samples showing natural patterns
- Stone or tile surface textures
- Metal finish textures (brushed, polished, matte)
- Wall texture samples (smooth, textured, wallpaper)

Layout requirements:
- Clean, organized grid layout
- Professional color theory presentation
- Elegant typography for labels
- White background with subtle shadows
- Magazine editorial quality
- Clear visual hierarchy
- Proportional color representation based on usage

Create a single comprehensive color and texture palette image that showcases the complete material and color story for the interior design project. Ultra high resolution, 16:9 aspect ratio.`;

    console.log("Calling AI for colors & textures generation...");

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
    console.log("Colors & Textures generation completed");

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = aiData.choices?.[0]?.message?.content || "Colors & Textures palette generated successfully";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    // Update pipeline step with results
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: {
        colorsTexturesUrl: imageUrl,
        description,
        colors: uniqueColors,
        materials: uniqueMaterials,
      },
      visual_outcome_url: imageUrl,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 6);

    console.log("Colors & Textures step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description,
        output: {
          colorsTexturesUrl: imageUrl,
          description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Colors & Textures error:", error);
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
