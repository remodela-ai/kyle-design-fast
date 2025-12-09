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
    const { sessionId, roomType, styleIdentified, totalBudget, conversationSummary } = await req.json();

    console.log("Management Step 8: Project Cover");
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const budgetDisplay = totalBudget 
      ? `$${totalBudget.min?.toLocaleString()} - $${totalBudget.max?.toLocaleString()}`
      : "Custom Investment";

    const prompt = `Create a stunning, premium Project Cover page image for an interior design portfolio/proposal.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}
- Investment: ${budgetDisplay}
${conversationSummary ? `- Vision: ${conversationSummary}` : ''}

Design Requirements:
1. Create an elegant, magazine-quality cover page
2. Large, sophisticated typography with:
   - "INTERIOR DESIGN PROJECT" as main title
   - "${roomType || 'Living Space'}" as subtitle
   - "${styleIdentified || 'Contemporary'} Design" as style tag

3. Include these elements:
   - Luxurious abstract or geometric background
   - Subtle gold/metallic accents
   - Professional design firm logo placeholder
   - Project reference number
   - Date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

4. Visual style:
   - High-end real estate/architecture magazine aesthetic
   - Rich textures and depth
   - Sophisticated color palette matching ${styleIdentified || 'modern'} style
   - Elegant borders or frames
   - Premium paper texture effect

5. Bottom section:
   - "Prepared exclusively for [Client Name]"
   - "NEXT INTERIORS" branding
   - Contact placeholder

6. Overall feel: Luxury, exclusivity, professionalism

Style: Ultra high resolution, magazine cover quality, luxury aesthetic, editorial design, premium presentation`;

    console.log("Generating project cover image...");

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

    console.log("Project cover image generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-cover:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
