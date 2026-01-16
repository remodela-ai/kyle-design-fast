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

    console.log("Starting Video Presentation generation for session:", sessionId);

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
    }).eq("session_id", sessionId).eq("step_number", 8);

    const elementNames = elements?.map((el: { name: string }) => el.name).slice(0, 5).join(", ") || "elegant furniture";

    const prompt = `Cinematic video presentation poster for interior design project showcase. ${roomType || 'Living Space'} in ${styleIdentified || 'Modern Contemporary'} style. Concept: ${conversationSummary || 'A luxurious and inviting interior space'}. Key elements: ${elementNames}. Dramatic photorealistic rendering of completed interior space, cinematic lighting with volumetric rays and golden hour atmosphere, professional architectural photography, depth of field effect on key design elements, luxury real estate marketing quality. Elegant centered play button icon, "DESIGN PRESENTATION" text at bottom, project title "${roomType || 'Interior'} | ${styleIdentified || 'Modern'} Collection", stylish film grain, cinematic color grading, letterboxing for cinematic feel. Warm inviting lighting, magazine-cover and film-poster quality, high-end design studio presentation. 16:9 widescreen cinematic aspect ratio, 8K ultra HD resolution.`;

    console.log("Calling Replicate for video presentation generation...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.3;
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No image was generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    const description = "Video Presentation poster generated with Flux 2 Pro";

    console.log("Video Presentation generation completed");

    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: {
        videoPresentationUrl: imageUrl,
        description,
        roomType,
        styleIdentified,
      },
      visual_outcome_url: imageUrl,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 8);

    await supabase.from("project_sessions").update({
      updated_at: new Date().toISOString(),
    }).eq("session_id", sessionId);

    console.log("Video Presentation step completed for session:", sessionId);
    console.log("🎉 PIPELINE COMPLETE!");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description,
        pipelineComplete: true,
        output: {
          videoPresentationUrl: imageUrl,
          description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Video Presentation error:", error);
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
