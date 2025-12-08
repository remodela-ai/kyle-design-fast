import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Starting Items Extraction for session:", sessionId);

    // Update step status to processing
    await supabase.from("pipeline_steps").update({
      status: "processing",
      started_at: new Date().toISOString(),
      input_data: { elements, roomType, styleIdentified },
    }).eq("session_id", sessionId).eq("step_number", 3);

    // Build elements list for the prompt
    const elementsList = elements?.map((el: { name: string; category: string; dimensions?: { width: number; height: number; depth: number }; color?: string; material?: string }) => 
      `- ${el.name} (${el.category}): ${el.dimensions?.width || '?'}m x ${el.dimensions?.height || '?'}m x ${el.dimensions?.depth || '?'}m, ${el.color || 'unknown color'}, ${el.material || 'unknown material'}`
    ).join('\n') || 'No elements provided';

    // Call Lovable AI for items extraction with purchase suggestions
    const extractionPrompt = `You are an expert interior designer and shopping assistant. Based on the following elements detected in a ${roomType || 'room'} with ${styleIdentified || 'modern'} style, provide detailed product information and purchase suggestions.

Elements detected:
${elementsList}

For each item, provide:
1. A refined product name suitable for shopping searches
2. Estimated price range (USD)
3. Search keywords for finding similar items
4. Suggested stores/retailers where this type of item can be found
5. A shopping URL (use Google Shopping search URL format)

Respond in JSON format:
{
  "items": [
    {
      "originalName": "original element name from the list",
      "productName": "refined searchable product name",
      "category": "furniture|lighting|decor|textile|plant|electronic|other",
      "estimatedPriceRange": {
        "min": number,
        "max": number,
        "currency": "USD"
      },
      "searchKeywords": ["keyword1", "keyword2", "keyword3"],
      "suggestedRetailers": ["Store1", "Store2", "Store3"],
      "shoppingUrl": "https://www.google.com/search?tbm=shop&q=product+name",
      "description": "Brief product description",
      "dimensions": {
        "width": number,
        "height": number,
        "depth": number
      },
      "material": "material type",
      "color": "color"
    }
  ],
  "totalEstimatedBudget": {
    "min": number,
    "max": number,
    "currency": "USD"
  },
  "shoppingTips": ["tip1", "tip2"]
}

Be realistic with price estimates based on quality and style.`;

    console.log("Calling AI for items extraction...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: extractionPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      await supabase.from("pipeline_steps").update({
        status: "error",
        error_message: `AI extraction failed: ${response.status}`,
        completed_at: new Date().toISOString(),
      }).eq("session_id", sessionId).eq("step_number", 3);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const data = await response.json();
    const extractionText = data.choices?.[0]?.message?.content || "";
    
    console.log("Items extraction completed");

    // Try to parse JSON from response
    let extractionJson = null;
    try {
      const jsonMatch = extractionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractionJson = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Could not parse JSON from response, using raw text");
    }

    const outputData = {
      rawExtraction: extractionText,
      parsedExtraction: extractionJson,
      items: extractionJson?.items || [],
      totalEstimatedBudget: extractionJson?.totalEstimatedBudget,
      shoppingTips: extractionJson?.shoppingTips || [],
      timestamp: new Date().toISOString(),
    };

    // Update step as completed
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: outputData,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 3);

    console.log("Items Extraction step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        stepNumber: 3,
        stepName: "Items Extraction",
        output: outputData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pipeline-items-extraction:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
