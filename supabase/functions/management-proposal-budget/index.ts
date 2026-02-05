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
    const { sessionId, elements, roomType, styleIdentified, totalBudget, conversationSummary, referenceImage } = await req.json();

    console.log("Management Step 1: Proposal & Budget");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; category?: string; material?: string }) => 
          `${e.name || 'Item'} (${e.category || 'general'})`
        ).join(", ")
      : "various furniture and decor items";

    const budgetInfo = totalBudget 
      ? `Budget Range: ${totalBudget.currency || '$'}${totalBudget.min?.toLocaleString() || '0'} - ${totalBudget.currency || '$'}${totalBudget.max?.toLocaleString() || '0'}`
      : "Budget: To be determined based on selections";

    const prompt = `Ultra-realistic photograph of a professional printed ESTIMATE AND PROPOSAL document on a luxury wooden desk. The document is a high-end interior design firm proposal printed on premium cream paper. Clear readable header "DESIGN PROPOSAL & ESTIMATE" in elegant serif typography. Document shows: Executive Summary section, Scope of Work detailed list, Investment Breakdown table with line items for Design Services, Furniture, Materials, Accessories, Installation fees, 10% contingency. Total Investment prominently displayed: ${budgetInfo}. Project phases timeline: Design Development, Procurement, Installation, Final Styling. Terms and conditions section. ${roomType || 'Interior'} project, ${styleIdentified || 'Contemporary'} style. Professional letterhead with firm logo placeholder, project reference number, date ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Subtle watermark. Gold pen and reading glasses beside document for scale. Soft natural lighting, shallow depth of field. 8K ultra HD, photorealistic document photography.`;

    console.log("Generating proposal & budget image with Flux 2 Pro...");

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
    
    console.log("Proposal generated, persisting to storage...");
    
    // Persist the image to Supabase Storage
    const imageUrl = await persistImageToStorage(tempImageUrl, `proposal-${sessionId}`);
    
    console.log("✅ Proposal persisted successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: "Professional design proposal and budget document",
        sessionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-proposal-budget:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
