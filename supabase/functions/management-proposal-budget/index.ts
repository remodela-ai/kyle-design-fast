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
    const { sessionId, elements, roomType, styleIdentified, totalBudget, conversationSummary } = await req.json();

    console.log("Management Step 1: Proposal & Budget");
    console.log("Session ID:", sessionId);
    console.log("Room Type:", roomType);
    console.log("Style:", styleIdentified);
    console.log("Total Budget:", totalBudget);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format elements for the prompt
    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; category?: string; material?: string }) => 
          `${e.name || 'Item'} (${e.category || 'general'})`
        ).join(", ")
      : "various furniture and decor items";

    // Format budget info
    const budgetInfo = totalBudget 
      ? `Budget Range: ${totalBudget.currency || '$'}${totalBudget.min?.toLocaleString() || '0'} - ${totalBudget.currency || '$'}${totalBudget.max?.toLocaleString() || '0'}`
      : "Budget: To be determined based on selections";

    const prompt = `Create a professional interior design project proposal and budget document image. This should look like a high-end design firm's proposal.

Project Details:
- Room Type: ${roomType || 'Interior Space'}
- Design Style: ${styleIdentified || 'Contemporary'}
- Items: ${elementsList}
- ${budgetInfo}
${conversationSummary ? `- Client Brief: ${conversationSummary}` : ''}

Design Requirements:
1. Create a elegant, professional proposal document layout
2. Include a header with "DESIGN PROPOSAL" title and project reference number
3. Show a budget breakdown section with:
   - Furniture costs
   - Materials & finishes
   - Accessories & decor
   - Design fees
   - Contingency (10%)
   - Total estimated investment
4. Include a project timeline section showing phases:
   - Design Development
   - Procurement
   - Installation
   - Final Styling
5. Add a scope of work summary
6. Use a sophisticated color palette matching ${styleIdentified || 'modern'} design aesthetic
7. Include decorative elements like watermarks, borders, or subtle patterns
8. Make it look like a premium PDF document that would be sent to high-end clients
9. The document should be portrait orientation, clean typography, and professional layout

Style: Ultra high resolution, professional document design, elegant typography, premium aesthetic`;

    console.log("Generating proposal & budget image with prompt:", prompt.substring(0, 200) + "...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("No image URL in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    console.log("Proposal & Budget image generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: textResponse || "Professional design proposal and budget document",
        sessionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in management-proposal-budget:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
