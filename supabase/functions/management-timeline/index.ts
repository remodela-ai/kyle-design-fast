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
    const { sessionId, roomType, styleIdentified, totalBudget } = await req.json();

    console.log("Management Step 3: Project Timeline");
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Create a professional project timeline/Gantt chart document image for an interior design project.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}
- Estimated Duration: 8-12 weeks

Timeline Phases to Show:
1. Week 1-2: Design Finalization
   - Final design approval
   - Material selections confirmed
   - Vendor contracts signed

2. Week 3-4: Procurement Phase
   - Order furniture items
   - Order materials & finishes
   - Custom items production begins

3. Week 5-6: Preparation
   - Site preparation
   - Demolition if needed
   - Base installations

4. Week 7-8: Installation Phase
   - Flooring & wall treatments
   - Lighting installation
   - Major furniture delivery

5. Week 9-10: Finishing
   - Accessories & decor placement
   - Custom items installation
   - Final adjustments

6. Week 11-12: Final Review
   - Client walkthrough
   - Punch list items
   - Project handover

Document Requirements:
1. Professional Gantt chart or timeline visualization
2. Header: "PROJECT TIMELINE" with dates
3. Color-coded phases for easy reading
4. Milestones marked clearly
5. Dependencies shown between tasks
6. Clean, modern design aesthetic
7. Include legend for phase colors
8. Show today's date marker
9. Professional typography

Style: Ultra high resolution, modern project management document, elegant visualization, premium aesthetic`;

    console.log("Generating timeline image...");

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

    console.log("Timeline image generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-timeline:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
