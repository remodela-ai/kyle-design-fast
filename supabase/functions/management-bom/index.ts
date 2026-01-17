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

    const prompt = `Ultra-realistic photograph of a professional printed BILL OF MATERIALS spreadsheet document on a modern office desk. Multi-page printed document showing comprehensive materials list for ${roomType || 'Interior'} design project in ${styleIdentified || 'Contemporary'} style. Clear header "BILL OF MATERIALS" with project reference. Detailed table with columns: Item #, Product Description, Category (Furniture/Lighting/Textiles/Decor), Supplier, SKU, Quantity, Unit Price, Total. Items visible: ${elementsList}. Category subtotals section. Grand Total: ${totalBudget ? `$${totalBudget.min?.toLocaleString()} - $${totalBudget.max?.toLocaleString()}` : 'TBD'}. Professional grid layout, alternating row colors for readability. Notes section for lead times and special orders. Printed on white paper, mechanical pencil and highlighter nearby. Clean organized desk setting, overhead view angle. 8K ultra HD, photorealistic document photography, sharp typography.`;

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

    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      throw new Error("No image generated");
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const imageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));
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
