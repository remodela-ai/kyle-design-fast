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
    const { sessionId, roomType, styleIdentified, elements } = await req.json();

    console.log("Management Step 6: Installation Plan");
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Create a professional Installation Plan/Guide document image for an interior design project.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}

Document Sections:

1. PRE-INSTALLATION CHECKLIST
   □ Site measurements verified
   □ Electrical points confirmed
   □ Plumbing connections checked
   □ HVAC vents located
   □ Access routes cleared

2. ELECTRICAL LAYOUT
   - Outlet positions
   - Switch locations
   - Lighting fixture points
   - Data/TV cable runs
   - Circuit requirements

3. PLUMBING CONSIDERATIONS
   - Water supply points
   - Drainage locations
   - Appliance connections

4. FURNITURE PLACEMENT GUIDE
   - Entry sequence (which items first)
   - Assembly requirements
   - Positioning coordinates
   - Clearance requirements

5. INSTALLATION SEQUENCE
   Phase 1: Base preparation
   Phase 2: Electrical/Plumbing
   Phase 3: Flooring
   Phase 4: Wall treatments
   Phase 5: Large furniture
   Phase 6: Lighting
   Phase 7: Accessories

6. SAFETY REQUIREMENTS
   - PPE requirements
   - Tool checklist
   - Emergency contacts

Document Requirements:
1. Header: "INSTALLATION PLAN"
2. Visual floor plan with marked points
3. Clear numbered sequence
4. Checkboxes for completion tracking
5. Professional technical drawing style
6. Color-coded systems (electrical=yellow, plumbing=blue)

Style: Ultra high resolution, professional technical document, installation guide aesthetic, premium layout`;

    console.log("Generating installation plan image...");

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

    console.log("Installation plan image generated successfully");

    return new Response(
      JSON.stringify({ success: true, imageUrl, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-installation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
