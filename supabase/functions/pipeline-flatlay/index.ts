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
   const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
 
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
   
   const { error } = await supabaseClient.storage
     .from(bucket)
     .upload(filePath, uint8Array, { contentType, upsert: true });
   
   if (error) {
     console.error("[persist] Storage upload error:", error);
     throw new Error(`Failed to upload image: ${error.message}`);
   }
   
   const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
   
   console.log(`[persist] ✅ Image persisted to: ${urlData.publicUrl}`);
   return urlData.publicUrl;
 }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, elements, roomType, styleIdentified, referenceImage } = await req.json();

    console.log("Starting Material Flatlay generation for session:", sessionId);

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
    }).eq("session_id", sessionId).eq("step_number", 5);

    const materials = elements?.map((el: { material?: string }) => el.material).filter(Boolean) || [];
    const colors = elements?.map((el: { color?: string }) => el.color).filter(Boolean) || [];
    const uniqueMaterials = [...new Set(materials)].join(", ") || "wood, fabric, metal, glass";
    const uniqueColors = [...new Set(colors)].join(", ") || "neutral tones";

    const prompt = `Professional interior design material flatlay photograph, top-down view for a ${roomType || 'living space'} in ${styleIdentified || 'modern'} style. Fabric swatches and textile samples in ${uniqueMaterials}. Wood finish samples and veneer pieces. Metal hardware samples. Stone or tile samples. Paint color chips in ${uniqueColors}. Decorative trim samples. Leather or upholstery samples. Clean white background, professional overhead flat lay photography, materials arranged aesthetically with slight overlapping, natural shadows for depth, magazine-quality styling, high-end interior design presentation. Square 1:1 aspect ratio, 8K ultra HD resolution.`;

    console.log("Calling Replicate for flatlay generation...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.2;
    }

    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      throw new Error("No image was generated");
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const tempImageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));

    console.log("Flatlay generated, persisting to storage...");
     
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, `flatlay-${sessionId}`);
    const description = "Material flatlay generated with Flux 2 Pro";
     
    console.log("✅ Flatlay persisted successfully");

    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: {
        flatlayUrl: imageUrl,
        description,
        materials: uniqueMaterials,
        colors: uniqueColors,
      },
      visual_outcome_url: imageUrl,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 5);

    console.log("Material Flatlay step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description,
        output: {
          flatlayUrl: imageUrl,
          description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Material Flatlay error:", error);
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
