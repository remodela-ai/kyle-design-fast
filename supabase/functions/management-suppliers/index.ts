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

    console.log("Management Step 5: Supplier Directory");
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categories = Array.isArray(elements)
      ? [...new Set(elements.map((e: { category?: string }) => e.category || 'General'))].join(", ")
      : "Furniture, Lighting, Decor, Textiles";

    const prompt = `Create a professional Supplier Directory document image for an interior design project.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}
- Categories needed: ${categories}

Supplier Categories to Include:

1. FURNITURE SUPPLIERS
   - Premium brands
   - Custom furniture makers
   - Contact placeholder
   - Estimated lead times

2. LIGHTING SPECIALISTS
   - Fixture suppliers
   - Custom lighting designers
   - Smart lighting providers

3. FABRIC & TEXTILES
   - Upholstery suppliers
   - Curtain/drapery vendors
   - Rug specialists

4. MATERIALS & FINISHES
   - Flooring suppliers
   - Paint/wallcovering vendors
   - Stone/tile suppliers

5. DECOR & ACCESSORIES
   - Art galleries
   - Decorative object suppliers
   - Plant/greenery vendors

6. SPECIALTY CONTRACTORS
   - Electricians
   - Carpenters
   - Installers

Document Requirements:
1. Header: "SUPPLIER DIRECTORY"
2. Clean table format with columns:
   - Category
   - Supplier Name
   - Specialty
   - Contact Info (placeholder)
   - Rating/Notes
3. Color-coded by category
4. Space for adding custom suppliers
5. Professional typography
6. Include QR code placeholders for websites

Style: Ultra high resolution, professional directory layout, organized and clean, premium aesthetic`;

    console.log("Generating suppliers image...");

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
