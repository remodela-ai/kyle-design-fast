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
    const { prompt, referenceImage } = await req.json();
    
    if (!prompt) {
      console.error("[blink-design] No prompt provided");
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!REPLICATE_API_KEY) {
      console.error("[blink-design] REPLICATE_API_KEY not configured");
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    if (!LOVABLE_API_KEY) {
      console.error("[blink-design] LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Check if prompt is a full transcript (contains TRANSCRIPT marker)
    const isFullTranscript = prompt.includes('CONVERSATION TRANSCRIPT') || prompt.includes('---TRANSCRIPT---');
    
    let optimizedPrompt: string;
    let originalTranscript: string | null = null;

    if (isFullTranscript) {
      // Extract insights using Gemini before sending to Flux 2 Pro
      console.log("[blink-design] Full transcript detected, extracting insights with Gemini...");
      originalTranscript = prompt;

      const insightExtractionSystemPrompt = `You are an expert interior design prompt engineer specialized in creating precise image generation prompts for Flux 2 Pro.

Your task: Analyze the conversation transcript and create a detailed, optimized prompt for generating a photorealistic interior design image.

CRITICAL RULES:
1. Extract ONLY elements explicitly discussed in the conversation
2. If the client said "no plants", "no rug", "no TV" - these items MUST NOT appear
3. Be extremely specific about colors (use exact shades: "warm oak wood", "dusty rose", "charcoal gray")
4. Include exact materials and textures mentioned
5. Specify the camera angle and lighting quality
6. Maximum 300 words for the final prompt

EXTRACTION CHECKLIST:
- Room type and approximate dimensions
- Design style (modern, minimalist, boho, industrial, scandinavian, etc.)
- Color palette with specific tones
- Furniture pieces and their materials
- Flooring and wall treatments
- Lighting type (natural, warm ambient, dramatic, etc.)
- Decorative elements mentioned
- Items explicitly EXCLUDED by the client

OUTPUT FORMAT:
Write a single, cohesive image generation prompt in English. Start with the room type, then describe the space flowing naturally from the overall atmosphere to specific details. End with photography style notes.

Example output format:
"A modern minimalist living room with floor-to-ceiling windows flooding the space with natural light. The walls are painted in warm white with subtle texture. A low-profile charcoal gray sectional sofa with clean lines faces a walnut wood media console. Light oak hardwood floors throughout. No plants or rugs. The coffee table is matte black metal with a marble top. Shot as high-end architectural photography, eye-level perspective, soft natural afternoon light, 8K ultra HD resolution."`;

      try {
        console.log("[blink-design] Calling Gemini for insight extraction...");
        
        const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: insightExtractionSystemPrompt },
              { role: "user", content: `Here is the conversation transcript to analyze:\n\n${prompt}\n\nGenerate the optimized image prompt based on this conversation.` }
            ],
            max_tokens: 600
          })
        });

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("[blink-design] Gemini API error:", geminiResponse.status, errorText);
          
          if (geminiResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (geminiResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: "Payment required, please add funds." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        optimizedPrompt = geminiData.choices?.[0]?.message?.content || "";
        
        if (!optimizedPrompt.trim()) {
          console.error("[blink-design] Empty response from Gemini");
          throw new Error("Failed to extract design insights");
        }

        console.log("[blink-design] ✅ Gemini extracted prompt:", optimizedPrompt.substring(0, 200) + "...");
        
      } catch (geminiError) {
        console.error("[blink-design] Gemini extraction failed:", geminiError);
        // Fallback to simple prompt if Gemini fails
        optimizedPrompt = `Professional interior design photograph based on client consultation. High-end architectural photography, excellent natural lighting, magazine quality composition. 8K ultra HD resolution.`;
      }
    } else {
      // Simple prompt - use directly with standard formatting
      optimizedPrompt = `Professional interior design photograph: ${prompt}. Photorealistic, high-end architectural photography, excellent natural lighting, magazine quality composition. 8K ultra HD resolution.`;
    }

    // Add final image generation suffix
    const finalImagePrompt = `${optimizedPrompt}

Photorealistic interior design photograph. High-end architectural photography, professional lighting, magazine quality composition.`;

    console.log("[blink-design] Final prompt for Flux 2 Pro:", finalImagePrompt.substring(0, 300) + "...");
    console.log("[blink-design] Reference image:", referenceImage ? "provided" : "none");

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Build input parameters for Flux 2 Pro
    const input: Record<string, unknown> = {
      prompt: finalImagePrompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    // Add reference image if provided
    if (referenceImage) {
      input.image_prompt = referenceImage;
      input.image_prompt_strength = 0.70;
      console.log("[blink-design] Added reference image with strength 0.70 for consistency");
    }

    console.log("[blink-design] Generating image with Flux 2 Pro...");
    const output = await replicate.run("black-forest-labs/flux-2-pro", { input });

    if (!output) {
      console.error("[blink-design] No output from Replicate");
      return new Response(
        JSON.stringify({ error: "No image was generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flux 2 Pro returns an object with .url() method or a string
    const imageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));
    
    console.log("[blink-design] ✅ Image generated successfully");

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        optimizedPrompt: isFullTranscript ? optimizedPrompt : null,
        originalTranscript: originalTranscript,
        usedLLM: isFullTranscript,
        description: "Design generated with Flux 2 Pro" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[blink-design] Unexpected error:", error);
    
    // Handle Replicate-specific errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage.includes("payment") || errorMessage.includes("402") || errorMessage.includes("insufficient")) {
      return new Response(
        JSON.stringify({ error: "Payment required, please add funds to your Replicate account." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
