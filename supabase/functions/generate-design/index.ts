import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
 
 // Persist image from temporary Replicate URL to Supabase Storage
 async function persistImageToStorage(
   tempImageUrl: string,
   fileName: string,
   bucket: string = "designer-assets"
 ): Promise<string> {
   const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
   const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
   
   const supabase = createClient(supabaseUrl, supabaseServiceKey);
   
   console.log(`[persist] Downloading image from: ${tempImageUrl.substring(0, 80)}...`);
   
   const response = await fetch(tempImageUrl);
   if (!response.ok) {
     throw new Error(`Failed to download image: ${response.statusText}`);
   }
   
   const imageBlob = await response.blob();
   const arrayBuffer = await imageBlob.arrayBuffer();
   const uint8Array = new Uint8Array(arrayBuffer);
   
   const contentType = response.headers.get("content-type") || "image/webp";
   const extension = contentType.includes("png") ? "png" : 
                     contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "webp";
   const uniqueFileName = `${fileName}-${Date.now()}.${extension}`;
   const filePath = `generated/${uniqueFileName}`;
   
   console.log(`[persist] Uploading to storage: ${bucket}/${filePath}`);
   
   const { error } = await supabase.storage
     .from(bucket)
     .upload(filePath, uint8Array, { contentType, upsert: true });
   
   if (error) {
     console.error("[persist] Storage upload error:", error);
     throw new Error(`Failed to upload image: ${error.message}`);
   }
   
   const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
   
   console.log(`[persist] ✅ Image persisted to: ${urlData.publicUrl}`);
   return urlData.publicUrl;
 }

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

    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      console.error("No output from Replicate");
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const tempImageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));
    console.log("Generation completed, persisting to storage...");
     
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, "design-gen");
     
    console.log("✅ Image persisted successfully");

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
