import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const { sessionId, roomType, styleIdentified, elements, referenceImage } = await req.json();

    console.log("Management Step 7: Delivery Checklist");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const itemCount = Array.isArray(elements) ? elements.length : 10;

    const prompt = `Professional Delivery and Quality Control Checklist document for interior design project. ${roomType || 'Interior Space'} in ${styleIdentified || 'Contemporary'} style. Approximately ${itemCount} items. Header "DELIVERY & QUALITY CHECKLIST". Sections: PRE-DELIVERY VERIFICATION with checkboxes for items ordered confirmed, delivery dates scheduled, access arrangements, storage space, insurance. FURNITURE INSPECTION checkboxes for correct items, no damage, dimensions match, color finish correct, assembly parts, hardware. LIGHTING CHECK for fixtures, wattage, bulbs, mounting hardware. TEXTILES SOFT GOODS for fabric color, defects, size specifications, care labels. INSTALLATION QUALITY for level aligned, secure mounting, no scratches, spacing, functionality. FINAL WALKTHROUGH for all items placed, electrical working, no damage, cleaned, client satisfied. SIGN-OFF section with date, inspector, client signature, notes fields. Clear checkbox format, space for notes comments, photo documentation placeholders, professional form layout. Portrait aspect ratio, 8K ultra HD resolution, professional checklist form, clean organized layout.`;

    console.log("Generating checklist image with Flux 2 Pro...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "3:4",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.15;
    }

    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      throw new Error("No image generated");
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const tempImageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));
    
    console.log("Checklist generated, persisting to storage...");
    
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, `checklist-${sessionId}`);
    
    console.log("✅ Checklist persisted successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-checklist:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
