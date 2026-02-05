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

    console.log("Management Step 6: Installation Plan");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const prompt = `Professional Installation Plan Guide document for interior design project. ${roomType || 'Interior Space'} in ${styleIdentified || 'Contemporary'} style. Header "INSTALLATION PLAN". Sections: PRE-INSTALLATION CHECKLIST with checkboxes for site measurements verified, electrical points confirmed, plumbing connections checked, HVAC vents located, access routes cleared. ELECTRICAL LAYOUT with outlet positions, switch locations, lighting fixture points, data TV cable runs, circuit requirements. PLUMBING CONSIDERATIONS with water supply points, drainage locations, appliance connections. FURNITURE PLACEMENT GUIDE with entry sequence, assembly requirements, positioning coordinates, clearance requirements. INSTALLATION SEQUENCE Phase 1 Base preparation, Phase 2 Electrical Plumbing, Phase 3 Flooring, Phase 4 Wall treatments, Phase 5 Large furniture, Phase 6 Lighting, Phase 7 Accessories. SAFETY REQUIREMENTS with PPE requirements, tool checklist, emergency contacts. Visual floor plan with marked points, clear numbered sequence, checkboxes for completion tracking, professional technical drawing style, color-coded systems electrical yellow plumbing blue. Portrait aspect ratio, 8K ultra HD resolution, professional technical document, installation guide aesthetic.`;

    console.log("Generating installation plan image with Flux 2 Pro...");

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
    
    console.log("Installation plan generated, persisting to storage...");
    
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, `installation-${sessionId}`);
    
    console.log("✅ Installation plan persisted successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-installation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
