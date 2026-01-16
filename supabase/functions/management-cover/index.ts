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
    const { sessionId, roomType, styleIdentified, totalBudget, conversationSummary, referenceImage } = await req.json();

    console.log("Management Step 8: Project Cover");
    console.log("Session ID:", sessionId);

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const budgetDisplay = totalBudget 
      ? `$${totalBudget.min?.toLocaleString()} - $${totalBudget.max?.toLocaleString()}`
      : "Custom Investment";

    const prompt = `Ultra-realistic photograph of a luxury hardcover DESIGN BOOK standing upright on a marble surface. The book cover features a beautiful interior design image of ${roomType || 'an elegant living space'} in ${styleIdentified || 'Contemporary'} style as the main cover artwork. Elegant gold foil embossed title "INTERIOR DESIGN PROJECT" at top. Subtitle "${roomType || 'Living Space'} • ${styleIdentified || 'Contemporary'} Design". Investment: ${budgetDisplay}. ${conversationSummary ? `Vision theme: ${conversationSummary}.` : ''} Premium matte finish book cover with subtle texture. Gold foil accents on spine visible. "NEXT INTERIORS" logo embossed at bottom. Date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. The cover image shows the actual designed space rendered beautifully. Coffee table book quality, museum-worthy presentation. Soft dramatic lighting, shallow depth of field, dark sophisticated background. 8K ultra HD, photorealistic product photography of luxury design book.`;

    console.log("Generating project cover image with Flux 2 Pro...");

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: "3:4",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.2;
    }

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    if (!output) {
      throw new Error("No image generated");
    }

    const imageUrl = typeof output === 'string' ? output : String(output);
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
