import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
    const { sessionId, elements, roomType, styleIdentified, referenceImage } = await req.json();

    console.log("Starting Colors & Textures generation for session:", sessionId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 6);

    const colors = elements?.map((el: { color?: string }) => el.color).filter(Boolean) || [];
    const materials = elements?.map((el: { material?: string }) => el.material).filter(Boolean) || [];
    const uniqueColors = [...new Set(colors)].join(", ") || "warm neutrals, soft grays, accent tones";
    const uniqueMaterials = [...new Set(materials)].join(", ") || "wood, fabric, metal";

    const prompt = `Professional interior design color and texture palette board for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style. Primary color swatches as large rectangles showing dominant colors: ${uniqueColors}. Secondary accent colors as medium rectangles. Tertiary neutral colors as smaller swatches. Color harmony diagram. Texture samples for: ${uniqueMaterials}. Fabric weave patterns, wood grain samples, stone or tile textures, metal finish textures. Clean organized grid layout, professional color theory presentation, elegant typography labels, white background with subtle shadows, magazine editorial quality, clear visual hierarchy. 16:9 aspect ratio, 8K ultra HD resolution.`;

    console.log("Calling Replicate for colors & textures generation...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.2;
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No image was generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    const description = "Colors & Textures palette generated with Flux 2 Pro";

    console.log("Colors & Textures generation completed");

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
