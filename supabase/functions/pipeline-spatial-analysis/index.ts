import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Optimized AI call - single attempt, fast model, shorter timeout
async function callAI(
  apiKey: string,
  prompt: string,
  imageUrl: string,
  timeoutMs = 30000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const startTime = Date.now();
    console.log(`AI call starting...`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // 3x faster than pro, sufficient quality
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
      throw new Error(`AI error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`AI call completed in ${Date.now() - startTime}ms`);
    return data.choices?.[0]?.message?.content || "";
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`AI call timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Fast JSON parsing - no LLM fallback (saves 5-10s)
function parseJson(text: string): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log("JSON parse failed, using raw text");
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, designImageUrl, conversationSummary, prewarm } = await req.json();

    // Pre-warm endpoint
    if (prewarm) {
      console.log("Pre-warm request received");
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

    // Cache check
    const { data: existingStep } = await supabase
      .from("pipeline_steps")
      .select("*")
      .eq("session_id", sessionId)
      .eq("step_number", 1)
      .eq("status", "completed")
      .single();

    if (existingStep?.output_data) {
      console.log("Returning cached spatial analysis");
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

    const startTime = Date.now();
    console.log("Starting Spatial Analysis for session:", sessionId);

    // Update step status
    await supabase.from("pipeline_steps").upsert({
      session_id: sessionId,
      step_number: 1,
      step_name: "Spatial Analysis",
      status: "processing",
      started_at: new Date().toISOString(),
      input_data: { designImageUrl, conversationSummary },
    }, { onConflict: "session_id,step_number" });

    // Compact optimized prompt - same output, fewer tokens
    const analysisPrompt = `Analyze this interior design image. Return ONLY valid JSON:
{"roomType":"string","estimatedDimensions":{"length":m,"width":m,"height":m},"elements":[{"id":"item_1","name":"Name","category":"furniture|lighting|decor|architectural|textile|plant|electronic|other","dimensions":{"width":m,"height":m,"depth":m},"color":"string","material":"string"}],"zones":[{"name":"string","purpose":"string","percentage":num}],"lightSources":{"natural":["desc"],"artificial":["desc"]},"spatialFlow":"string","styleIdentified":"string","atmosphereDescription":"string"}
${conversationSummary ? `Context: ${conversationSummary}` : ""}
Extract ALL visible elements with realistic measurements in meters. Be thorough.`;

    const analysisText = await callAI(LOVABLE_API_KEY, analysisPrompt, designImageUrl, 30000);
    
    console.log("Analysis received, length:", analysisText.length);

    const analysisJson = parseJson(analysisText);

    const outputData = {
      rawAnalysis: analysisText,
      parsedAnalysis: analysisJson,
      timestamp: new Date().toISOString(),
    };

    const memoryContext = {
      spatialAnalysis: analysisJson || analysisText,
      roomType: analysisJson?.roomType || "unknown",
      styleIdentified: analysisJson?.styleIdentified || "unknown",
    };

    await supabase.from("pipeline_steps").update({
      status: "completed",
      output_data: outputData,
      memory_context: memoryContext,
      completed_at: new Date().toISOString(),
    }).eq("session_id", sessionId).eq("step_number", 1);

    console.log(`Spatial Analysis completed in ${Date.now() - startTime}ms`);

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
