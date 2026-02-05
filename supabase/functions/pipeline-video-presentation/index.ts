import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Replicate from "https://esm.sh/replicate@0.25.2";

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
    const { sessionId, elements, roomType, styleIdentified, conversationSummary, referenceImage, designImageUrl } = await req.json();

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

    const prompt = `Video thumbnail overlay for interior design presentation. The EXACT SAME interior design image provided as reference with a semi-transparent dark overlay (20% opacity black gradient). Large centered PLAY BUTTON icon - white circle with triangle play symbol, elegant and minimal. Subtle text at bottom: "DESIGN PRESENTATION" in refined sans-serif typography. The background MUST be the original ${roomType || 'interior space'} design - do NOT generate a new room, use the reference image exactly as the base. Cinematic letterboxing effect (subtle black bars top and bottom). Professional video player thumbnail aesthetic, Netflix/YouTube premium video preview style. The play button should be the clear focal point. 16:9 widescreen aspect ratio, 8K ultra HD resolution.`;

    console.log("Calling Replicate for video presentation generation...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    // ALWAYS use the original design image with HIGH strength to preserve it
    const originalImage = designImageUrl || referenceImage;
    if (originalImage) {
      input.image_prompt = originalImage;
      input.image_prompt_strength = 0.85; // High strength to keep original image almost intact
    }

    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      throw new Error("No image was generated");
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const tempImageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));

    console.log("Video Presentation generated, persisting to storage...");
    
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, "video-presentation");
    const description = "Video Presentation poster generated with Flux 2 Pro";
    
    console.log("Video Presentation persisted successfully");

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
