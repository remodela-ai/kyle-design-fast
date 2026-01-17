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

    // Check if prompt is already a full transcript-based prompt (contains TRANSCRIPT marker)
    const isFullTranscript = prompt.includes('CONVERSATION TRANSCRIPT') || prompt.includes('---TRANSCRIPT---');
    
    let imagePrompt: string;
    if (isFullTranscript) {
      // Use the transcript-based prompt directly - it already has instructions
      imagePrompt = `${prompt}

Generate a photorealistic interior design photograph based on the above conversation. Style: high-end architectural photography, excellent natural lighting, magazine quality composition, 8K ultra HD resolution.`;
    } else {
      // Simple prompt - wrap with standard formatting
      imagePrompt = `Professional interior design photograph: ${prompt}. Photorealistic, high-end architectural photography, excellent natural lighting, magazine quality composition. 8K ultra HD resolution.`;
    }
    
    console.log("[blink-design] Prompt type:", isFullTranscript ? "full transcript" : "simple");
    console.log("[blink-design] Using prompt:", imagePrompt.substring(0, 300) + "...");

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

    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      console.error("[blink-design] No output from Replicate");
      return new Response(
        JSON.stringify({ error: "No image was generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const imageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));
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
