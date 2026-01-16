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

    console.log("Management Step 4: Technical Specifications");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; material?: string; color?: string }) => 
          `${e.name || 'Item'}: ${e.material || 'N/A'}, ${e.color || 'N/A'}`
        ).join(", ")
      : "Various items with materials and finishes";

    const prompt = `Ultra-realistic photograph of professional TECHNICAL CONSTRUCTION SPECIFICATIONS documents spread on an architect's drafting table. Multiple printed pages showing detailed installation instructions for ${roomType || 'Interior'} project, ${styleIdentified || 'Contemporary'} style. Header "TECHNICAL SPECIFICATIONS & INSTALLATION DETAILS". Pages include: CONSTRUCTION NOTES with wall preparation requirements, substrate conditions. ELECTRICAL SPECIFICATIONS with outlet placements, circuit requirements, fixture mounting heights. FLOORING INSTALLATION with subfloor prep, material type: ${elementsList}, expansion gaps, transitions. MILLWORK DETAILS with cabinet installation specs, hardware mounting. PAINT SPECIFICATIONS with primer coats, finish coats, color codes. PLUMBING REQUIREMENTS if applicable. Technical drawings with dimensions, detail callouts, section markers. Professional CAD-style diagrams. Scale ruler and architectural pencils nearby. Blueprint aesthetic with technical precision. 8K ultra HD, photorealistic technical document photography.`;

    console.log("Generating specs image with Flux 2 Pro...");

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
    console.log("Specs image generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-specs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
