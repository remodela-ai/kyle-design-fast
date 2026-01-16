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
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    console.log("Generating design with Flux 2 Pro for prompt:", prompt.substring(0, 100));

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    const imagePrompt = `Professional interior design visualization: ${prompt}. Photorealistic, high quality architectural photography, excellent lighting and composition. Modern, elegant interior design aesthetics. 8K ultra HD.`;

    const input: Record<string, unknown> = {
      prompt: imagePrompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.35;
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      console.error("No output from Replicate");
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    console.log("Generation completed successfully");

    return new Response(
      JSON.stringify({ imageUrl, description: "Design generated with Flux 2 Pro" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-design:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage.includes("payment") || errorMessage.includes("402")) {
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
