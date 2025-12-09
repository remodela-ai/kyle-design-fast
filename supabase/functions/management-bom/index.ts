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
    const { sessionId, elements, roomType, styleIdentified, totalBudget } = await req.json();

    console.log("Management Step 2: Bill of Materials (BOM)");
    console.log("Session ID:", sessionId);
    console.log("Elements count:", Array.isArray(elements) ? elements.length : 0);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; category?: string; material?: string; dimensions?: { width?: number; height?: number; depth?: number } }) => 
          `${e.name || 'Item'} - ${e.material || 'N/A'} (${e.dimensions?.width || 0}x${e.dimensions?.height || 0}x${e.dimensions?.depth || 0}cm)`
        ).join("\n")
      : "Various furniture and decor items";

    const prompt = `Create a professional Bill of Materials (BOM) document image for an interior design project.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}
- Budget Range: ${totalBudget ? `$${totalBudget.min?.toLocaleString()} - $${totalBudget.max?.toLocaleString()}` : 'TBD'}

Items to include:
${elementsList}

Document Requirements:
1. Create an elegant, professional spreadsheet-style document
2. Header: "BILL OF MATERIALS" with project reference
3. Table columns:
   - Item # (sequential numbering)
   - Description (item name)
   - Category (furniture, decor, lighting, etc.)
   - Quantity
   - Dimensions (W x H x D)
   - Material/Finish
   - Unit Cost (estimated)
   - Total Cost
4. Include subtotals by category
5. Grand total at bottom
6. Notes section for specifications
7. Professional typography and clean grid layout
8. Color scheme: neutral with ${styleIdentified || 'modern'} accents
9. Include supplier/vendor column placeholder

Style: Ultra high resolution, professional document design, clean spreadsheet aesthetic, premium look`;

    console.log("Generating BOM image...");

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
