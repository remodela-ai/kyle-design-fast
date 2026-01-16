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
    const { sessionId, elements, roomType, styleIdentified, totalBudget, referenceImage } = await req.json();

    console.log("Management Step 2: Bill of Materials (BOM)");
    console.log("Session ID:", sessionId);
    console.log("Elements count:", Array.isArray(elements) ? elements.length : 0);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; category?: string; material?: string; dimensions?: { width?: number; height?: number; depth?: number } }) => 
          `${e.name || 'Item'} - ${e.material || 'N/A'} (${e.dimensions?.width || 0}x${e.dimensions?.height || 0}x${e.dimensions?.depth || 0}cm)`
        ).join(", ")
      : "Various furniture and decor items";

    const prompt = `Professional Bill of Materials BOM document for interior design project. ${roomType || 'Interior Space'} in ${styleIdentified || 'Contemporary'} style. Budget Range: ${totalBudget ? `$${totalBudget.min?.toLocaleString()} - $${totalBudget.max?.toLocaleString()}` : 'TBD'}. Items: ${elementsList}. Elegant professional spreadsheet-style document. Header "BILL OF MATERIALS" with project reference. Table columns: Item number, Description, Category furniture decor lighting, Quantity, Dimensions W x H x D, Material Finish, Unit Cost, Total Cost. Subtotals by category. Grand total at bottom. Notes section for specifications. Professional typography, clean grid layout, neutral color scheme with ${styleIdentified || 'modern'} accents, supplier vendor column placeholder. Portrait aspect ratio, 8K ultra HD resolution, professional document design, clean spreadsheet aesthetic.`;

    console.log("Generating BOM image with Flux 2 Pro...");

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

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No image generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    console.log("BOM image generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-bom:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
