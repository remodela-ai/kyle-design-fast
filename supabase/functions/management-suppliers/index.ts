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
    const { sessionId, elements, roomType, styleIdentified, referenceImage } = await req.json();

    console.log("Management Step 5: Supplier Directory");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const categories = Array.isArray(elements)
      ? [...new Set(elements.map((e: { category?: string }) => e.category || 'General'))].join(", ")
      : "Furniture, Lighting, Decor, Textiles";

    const prompt = `Ultra-realistic photograph of a professional SUPPLIER DIRECTORY document printed and organized in a luxury leather binder on an executive desk. ${roomType || 'Interior'} project, ${styleIdentified || 'Contemporary'} style. Clear header "APPROVED SUPPLIER DIRECTORY". Organized sections with category tabs visible: ${categories}. Each section shows supplier table with columns: Company Name, Contact Person, Phone, Email, Specialty, Lead Time, Payment Terms, Rating. Suppliers organized by category: FURNITURE vendors, LIGHTING specialists, FABRIC & TEXTILES sources, FLOORING suppliers, CUSTOM MILLWORK craftsmen, ART & ACCESSORIES galleries, INSTALLATION contractors. Business cards tucked into page corners. Professional index tabs on side. Notes column for project-specific comments. QR codes for websites. Clean corporate design, color-coded sections. Fountain pen and phone nearby. 8K ultra HD, photorealistic document photography, organized professional aesthetic.`;

    console.log("Generating suppliers image with Flux 2 Pro...");

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
    console.log("Suppliers image generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-suppliers:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
