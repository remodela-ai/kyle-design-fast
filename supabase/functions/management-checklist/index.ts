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

    console.log("Management Step 7: Delivery Checklist");
    console.log("Session ID:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const itemCount = Array.isArray(elements) ? elements.length : 10;

    const prompt = `Create a professional Delivery/Quality Control Checklist document image for an interior design project.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}
- Approximate items: ${itemCount}

Document Sections:

1. PRE-DELIVERY VERIFICATION
   □ All items ordered and confirmed
   □ Delivery dates scheduled
   □ Access arrangements made
   □ Storage space prepared
   □ Insurance verified

2. FURNITURE INSPECTION
   □ Correct items received
   □ No damage to packaging
   □ Dimensions match specifications
   □ Color/finish as specified
   □ Assembly parts complete
   □ Hardware included

3. LIGHTING CHECK
   □ All fixtures received
   □ Correct wattage/specifications
   □ Bulbs included
   □ Mounting hardware present

4. TEXTILES & SOFT GOODS
   □ Correct fabric/color
   □ No defects or stains
   □ Size specifications match
   □ Care labels attached

5. INSTALLATION QUALITY
   □ Level and aligned
   □ Secure mounting
   □ No scratches or marks
   □ Proper spacing
   □ Functionality tested

6. FINAL WALKTHROUGH
   □ All items in place
   □ Electrical working
   □ No damage to walls/floors
   □ Space cleaned
   □ Client satisfied

7. SIGN-OFF
   - Date: _____________
   - Inspector: _____________
   - Client signature: _____________
   - Notes: _____________

Document Requirements:
1. Header: "DELIVERY & QUALITY CHECKLIST"
2. Clear checkbox format
3. Space for notes/comments
4. Photo documentation placeholders
5. Professional form layout
6. Signature/date fields

Style: Ultra high resolution, professional checklist form, clean organized layout, premium aesthetic`;

    console.log("Generating checklist image...");

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
