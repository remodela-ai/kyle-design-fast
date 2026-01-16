import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { prompt, referenceImage } = await req.json();
    
    if (!prompt) {
      console.error("[blink-design] No prompt provided");
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      console.error("[blink-design] REPLICATE_API_KEY not configured");
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    console.log("[blink-design] Generating design with Flux 2 Pro");
    console.log("[blink-design] Reference image:", referenceImage ? "provided" : "none");

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    const imagePrompt = `Professional interior design photograph: ${prompt}. Photorealistic, high-end architectural photography, excellent natural lighting, magazine quality composition. 8K ultra HD resolution.`;
    console.log("[blink-design] Using prompt:", imagePrompt.substring(0, 200) + "...");

    // Build input parameters
    const input: Record<string, unknown> = {
      prompt: imagePrompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    // Add reference image if provided
    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.35;
      console.log("[blink-design] Added reference image with strength 0.35");
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      console.error("[blink-design] No output from Replicate");
      return new Response(
        JSON.stringify({ error: "No image was generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Replicate returns the image URL directly
    const imageUrl = typeof output === 'string' ? output : String(output);
    console.log("[blink-design] Image generated successfully");

    return new Response(
      JSON.stringify({ imageUrl, description: "Design generated with Flux 2 Pro" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[blink-design] Unexpected error:", error);
    
    // Handle Replicate-specific errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage.includes("payment") || errorMessage.includes("402") || errorMessage.includes("insufficient")) {
      return new Response(
        JSON.stringify({ error: "Payment required, please add funds to your Replicate account." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
