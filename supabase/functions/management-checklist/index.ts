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

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No image generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
    console.log("Checklist image generated successfully");

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
