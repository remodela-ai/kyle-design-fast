import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: Call AI with timeout and retry
async function callAIWithRetry(
  apiKey: string,
  prompt: string,
  imageUrl: string,
  maxRetries = 2,
  timeoutMs = 90000
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`AI call attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429 && attempt < maxRetries) {
          console.log("Rate limited, waiting before retry...");
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`AI error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
      
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`Attempt ${attempt + 1} timed out after ${timeoutMs}ms`);
      } else {
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }
      
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("AI call failed after retries");
}

// Helper: Parse JSON with LLM fallback
async function parseJsonWithFallback(
  text: string,
  apiKey: string
): Promise<{ parsed: any; usedFallback: boolean }> {
  // First try regex extraction
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { parsed, usedFallback: false };
    }
  } catch (e) {
    console.log("Initial JSON parse failed, trying LLM fallback...");
  }
  
  // LLM fallback for corrupted JSON
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `Extract and fix the JSON from this text. Return ONLY valid JSON, nothing else:\n\n${text.substring(0, 8000)}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const fixedText = data.choices?.[0]?.message?.content || "";
      const jsonMatch = fixedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { parsed: JSON.parse(jsonMatch[0]), usedFallback: true };
      }
    }
  } catch (e) {
    console.error("LLM fallback also failed:", e);
  }
  
  return { parsed: null, usedFallback: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, designImageUrl, conversationSummary, prewarm } = await req.json();

    // Pre-warm endpoint for YC demo
    if (prewarm) {
      console.log("Pre-warm request received - keeping function hot");
      return new Response(
        JSON.stringify({ success: true, message: "Function warmed up" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sessionId || !designImageUrl) {
      return new Response(
        JSON.stringify({ error: "sessionId and designImageUrl are required" }),
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

    // Cache check: Return existing completed analysis
    const { data: existingStep } = await supabase
      .from("pipeline_steps")
      .select("*")
      .eq("session_id", sessionId)
      .eq("step_number", 1)
      .eq("status", "completed")
      .single();

    if (existingStep?.output_data) {
      console.log("Returning cached spatial analysis for session:", sessionId);
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          stepNumber: 1,
          stepName: "Spatial Analysis",
          output: existingStep.output_data,
          memory: existingStep.memory_context,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting Spatial Analysis for session:", sessionId);

    // Update step status to processing
    await supabase.from("pipeline_steps").upsert({
      session_id: sessionId,
      step_number: 1,
      step_name: "Spatial Analysis",
      status: "processing",
      started_at: new Date().toISOString(),
      input_data: { designImageUrl, conversationSummary },
    }, { onConflict: "session_id,step_number" });

    const analysisPrompt = `You are an expert interior designer and spatial analyst. Analyze this interior design image and provide a comprehensive spatial analysis with element extraction.

${conversationSummary ? `Context from conversation: ${conversationSummary}` : ""}

IMPORTANT: Extract EVERY visible element/object in the image and estimate its MEASUREMENTS (dimensions) in 3D:
- X = width (horizontal measurement)
- Y = height (vertical measurement)  
- Z = depth (how deep/thick the element is)

Provide your analysis in the following JSON format:
{
  "roomType": "string - type of room (living room, bedroom, etc.)",
  "estimatedDimensions": {
    "length": "number in meters",
    "width": "number in meters",
    "height": "number in meters"
  },
  "elements": [
    {
      "id": "unique identifier (e.g., 'sofa_1', 'lamp_2')",
      "name": "element name (e.g., 'Sectional Sofa', 'Floor Lamp')",
      "category": "furniture|lighting|decor|architectural|textile|plant|electronic|other",
      "dimensions": {
        "width": "estimated width in meters (X axis)",
        "height": "estimated height in meters (Y axis)",
        "depth": "estimated depth in meters (Z axis)"
      },
      "color": "primary color",
      "material": "primary material (wood, fabric, metal, glass, etc.)"
    }
  ],
  "zones": [
    {
      "name": "zone name",
      "purpose": "what this area is used for",
      "percentage": "approximate percentage of room"
    }
  ],
  "lightSources": {
    "natural": ["description of natural light sources"],
    "artificial": ["description of artificial light sources"]
  },
  "spatialFlow": "description of how space flows and movement patterns",
  "styleIdentified": "identified interior design style",
  "atmosphereDescription": "description of the overall atmosphere and mood"
}

Be thorough - extract ALL visible elements including furniture, lamps, rugs, plants, artwork, pillows, etc. Provide realistic measurements in meters.`;

    // Call AI with timeout and retry
    const analysisText = await callAIWithRetry(
      LOVABLE_API_KEY,
      analysisPrompt,
      designImageUrl,
      2,
      90000
    );
    
    console.log("Spatial analysis completed:", analysisText.substring(0, 200));

    // Parse JSON with LLM fallback
    const { parsed: analysisJson, usedFallback } = await parseJsonWithFallback(
      analysisText,
      LOVABLE_API_KEY
    );

    if (usedFallback) {
      console.log("Used LLM fallback for JSON parsing");
    }

    const outputData = {
      rawAnalysis: analysisText,
      parsedAnalysis: analysisJson,
      timestamp: new Date().toISOString(),
      usedJsonFallback: usedFallback,
    };

    const memoryContext = {
      spatialAnalysis: analysisJson || analysisText,
      roomType: analysisJson?.roomType || "unknown",
      styleIdentified: analysisJson?.styleIdentified || "unknown",
    };

    // Update step as completed
    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: outputData,
      memory_context: memoryContext,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 1);

    console.log("Spatial Analysis step completed for session:", sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        stepNumber: 1,
        stepName: "Spatial Analysis",
        output: outputData,
        memory: memoryContext,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pipeline-spatial-analysis:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});