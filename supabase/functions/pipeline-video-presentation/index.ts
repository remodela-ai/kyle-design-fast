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

    console.log("Starting Video Presentation generation for session:", sessionId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update step status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 8);

    // Build context from elements
    const elementNames = elements?.map((el: { name: string }) => el.name).slice(0, 5).join(", ") || "elegant furniture";

    const prompt = `Create a cinematic video presentation thumbnail/poster for an interior design project showcase.

Project details:
- Room: ${roomType || 'Living Space'}
- Style: ${styleIdentified || 'Modern Contemporary'}
- Concept: ${conversationSummary || 'A luxurious and inviting interior space'}
- Key elements: ${elementNames}

Design a stunning cinematic poster that includes:

VISUAL ELEMENTS:
- A dramatic, photorealistic rendering of the completed interior space
- Cinematic lighting with volumetric rays or golden hour atmosphere
- Professional architectural photography style
- Depth of field effect focusing on key design elements
- Luxury real estate marketing quality

OVERLAY ELEMENTS:
- Elegant play button icon (subtle, centered)
- "DESIGN PRESENTATION" text at bottom
- Project title: "${roomType || 'Interior'} | ${styleIdentified || 'Modern'} Collection"
- Stylish film grain or cinematic color grading
- Aspect ratio indicators or letterboxing for cinematic feel

ATMOSPHERE:
- Warm, inviting lighting
- Professional interior photography mood
- Magazine-cover or film-poster quality
- High-end design studio presentation level

Create a single stunning video presentation thumbnail that would be used to represent a walkthrough video of this interior design project. Ultra high resolution, 16:9 widescreen cinematic aspect ratio.`;

    console.log("Calling AI for video presentation generation...");

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
    console.log("Video Presentation generation completed");

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = aiData.choices?.[0]?.message?.content || "Video Presentation poster generated successfully";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    // Update pipeline step with results
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

    // Mark pipeline as complete by updating the session
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
