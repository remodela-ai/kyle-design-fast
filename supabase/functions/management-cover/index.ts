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

    const prompt = `Stunning premium Project Cover page for interior design portfolio proposal. ${roomType || 'Interior Space'} in ${styleIdentified || 'Contemporary'} design style. Investment: ${budgetDisplay}. ${conversationSummary ? `Vision: ${conversationSummary}.` : ''} Elegant magazine-quality cover page with sophisticated typography: "INTERIOR DESIGN PROJECT" main title, "${roomType || 'Living Space'}" subtitle, "${styleIdentified || 'Contemporary'} Design" style tag. Luxurious abstract geometric background, subtle gold metallic accents, professional design firm logo placeholder, project reference number, date ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. High-end real estate architecture magazine aesthetic, rich textures and depth, sophisticated ${styleIdentified || 'modern'} color palette, elegant borders and frames, premium paper texture effect. Bottom section: "Prepared exclusively for Client" and "NEXT INTERIORS" branding. Luxury exclusivity professionalism feel. Portrait aspect ratio, 8K ultra HD resolution.`;

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
