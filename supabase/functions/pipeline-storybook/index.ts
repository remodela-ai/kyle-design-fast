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
    const { sessionId, elements, roomType, styleIdentified, conversationSummary, referenceImage } = await req.json();

    console.log("Starting Story Book generation for session:", sessionId);

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
    }).eq("session_id", sessionId).eq("step_number", 7);

    const elementNames = elements?.map((el: { name: string }) => el.name).join(", ") || "furniture and decor";
    const materials = elements?.map((el: { material?: string }) => el.material).filter(Boolean);
    const uniqueMaterials = [...new Set(materials)].join(", ") || "natural materials";

    const prompt = `Professional interior design storybook presentation page for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style. Design concept: ${conversationSummary || 'A sophisticated and welcoming interior space'}. Elegant title "Your Design Story" with room type and style subtitle. Decorative divider elements. Poetic description of space atmosphere, design inspiration and philosophy. Artistic vignette illustrations, decorative botanical borders, elegant serif typography, script accents for quotes. Featured elements: ${elementNames}. Material story: ${uniqueMaterials}. Magazine editorial quality, coffee table book aesthetic, warm inviting presentation, professional interior design portfolio style, cream or soft white background, gold or copper accent details. Portrait 3:4 aspect ratio, 8K ultra HD resolution.`;

    console.log("Calling Replicate for storybook generation...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "3:4",
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
    const description = "Story Book generated with Flux 2 Pro";

    console.log("Story Book generation completed");

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
