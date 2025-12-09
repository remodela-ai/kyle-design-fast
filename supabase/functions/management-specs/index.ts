import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, elements, roomType, styleIdentified } = await req.json();

    console.log("Management Step 4: Technical Specifications");
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; material?: string; color?: string }) => 
          `${e.name || 'Item'}: ${e.material || 'N/A'}, ${e.color || 'N/A'}`
        ).join("\n")
      : "Various items with materials and finishes";

    const prompt = `Create a professional Technical Specifications document image for an interior design project.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}

Elements:
${elementsList}

Document Sections:
1. FLOORING SPECIFICATIONS
   - Material type
   - Color/finish
   - Installation method
   - Maintenance requirements

2. WALL FINISHES
   - Paint colors (with codes)
   - Wallpaper/texture specifications
   - Accent wall treatments

3. CEILING TREATMENTS
   - Type and height
   - Lighting provisions
   - Crown molding details

4. FURNITURE SPECIFICATIONS
   - Dimensions for each piece
   - Material & upholstery
   - Care instructions

5. LIGHTING SPECIFICATIONS
   - Fixture types
   - Wattage/Lumens
   - Placement coordinates

6. WINDOW TREATMENTS
   - Curtain/blind type
   - Fabric specifications
   - Hardware details

Document Requirements:
1. Header: "TECHNICAL SPECIFICATIONS"
2. Organized sections with clear headers
3. Specification codes and references
4. Detailed measurements in metric
5. Material sample placeholders
6. Professional grid layout
7. Notes and special requirements section

Style: Ultra high resolution, professional specification sheet, clean technical document, premium aesthetic`;

    console.log("Generating specs image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

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
