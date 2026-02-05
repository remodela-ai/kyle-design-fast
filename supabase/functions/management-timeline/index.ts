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
    const { sessionId, roomType, styleIdentified, totalBudget, referenceImage } = await req.json();

    console.log("Management Step 3: Project Timeline");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const prompt = `Professional project timeline Gantt chart document for interior design project. ${roomType || 'Interior Space'} in ${styleIdentified || 'Contemporary'} style. Estimated Duration 8-12 weeks. Timeline Phases: Week 1-2 Design Finalization with final design approval, material selections confirmed, vendor contracts signed. Week 3-4 Procurement Phase with order furniture items, order materials finishes, custom items production. Week 5-6 Preparation with site preparation, demolition if needed, base installations. Week 7-8 Installation Phase with flooring wall treatments, lighting installation, major furniture delivery. Week 9-10 Finishing with accessories decor placement, custom items installation, final adjustments. Week 11-12 Final Review with client walkthrough, punch list items, project handover. Header "PROJECT TIMELINE" with dates. Professional Gantt chart visualization, color-coded phases, milestones marked clearly, dependencies shown, clean modern design, legend for phase colors, today date marker, professional typography. 16:9 aspect ratio, 8K ultra HD resolution, modern project management document, elegant visualization.`;

    console.log("Generating timeline image with Flux 2 Pro...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "16:9",
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
    
    console.log("Timeline image generated, persisting to storage...");
    
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, `timeline-${sessionId}`);
    
    console.log("✅ Timeline image persisted successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-timeline:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
