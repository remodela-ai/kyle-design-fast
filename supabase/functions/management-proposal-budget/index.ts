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
    const { sessionId, elements, roomType, styleIdentified, totalBudget, conversationSummary, referenceImage } = await req.json();

    console.log("Management Step 1: Proposal & Budget");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const elementsList = Array.isArray(elements) 
      ? elements.map((e: { name?: string; category?: string; material?: string }) => 
          `${e.name || 'Item'} (${e.category || 'general'})`
        ).join(", ")
      : "various furniture and decor items";

    const budgetInfo = totalBudget 
      ? `Budget Range: ${totalBudget.currency || '$'}${totalBudget.min?.toLocaleString() || '0'} - ${totalBudget.currency || '$'}${totalBudget.max?.toLocaleString() || '0'}`
      : "Budget: To be determined based on selections";

    const prompt = `Professional interior design project proposal and budget document. High-end design firm proposal style. ${roomType || 'Interior Space'} in ${styleIdentified || 'Contemporary'} style. Items: ${elementsList}. ${budgetInfo}. ${conversationSummary ? `Client Brief: ${conversationSummary}.` : ''} Elegant professional proposal document layout. Header "DESIGN PROPOSAL" with project reference number. Budget breakdown section showing Furniture costs, Materials and finishes, Accessories and decor, Design fees, Contingency 10 percent, Total estimated investment. Project timeline showing Design Development, Procurement, Installation, Final Styling phases. Scope of work summary. Sophisticated ${styleIdentified || 'modern'} color palette. Decorative watermarks borders subtle patterns. Premium PDF document for high-end clients. Portrait orientation, clean typography, professional layout. 8K ultra HD resolution, elegant typography, premium aesthetic.`;

    console.log("Generating proposal & budget image with Flux 2 Pro...");

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
    console.log("Proposal & Budget image generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        description: "Professional design proposal and budget document",
        sessionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in management-proposal-budget:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
