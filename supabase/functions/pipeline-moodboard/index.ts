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
    const { sessionId, elements, roomType, styleIdentified, designImageUrl, referenceImage } = await req.json();

    console.log("Starting Design Moodboard generation for session:", sessionId);

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
    }).eq("session_id", sessionId).eq("step_number", 4);

    const elementsList = elements?.map((el: { name: string; material?: string; color?: string }) => 
      `${el.name} (${el.material || 'standard'}, ${el.color || 'neutral'})`
    ).join(", ") || "various furniture and decor items";

    const prompt = `Professional interior design moodboard collage for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style. Color palette swatches showing harmonious colors. Material and texture samples including fabrics, wood, metals, stones. Key furniture silhouettes: ${elementsList}. Decorative elements, accessories, lighting fixtures, plants and greenery. Clean editorial magazine layout, professional design presentation, cohesive aesthetic, high-end interior design studio quality, elegant typography, white or neutral background. 16:9 aspect ratio, 8K ultra HD resolution.`;

    console.log("Calling Replicate for moodboard generation...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage || designImageUrl) {
      input.image_prompt = referenceImage || designImageUrl;
      input.image_prompt_strength = 0.25;
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No image was generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    const description = "Design moodboard generated with Flux 2 Pro";

    console.log("Moodboard generation completed");

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
