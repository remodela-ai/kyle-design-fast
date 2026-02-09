import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
 
// Persist image from temporary Replicate URL to Supabase Storage with retry logic
async function persistImageToStorage(
  tempImageUrl: string,
  fileName: string,
  bucket: string = "designer-assets",
  maxRetries: number = 3
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`[persist] Downloading image from: ${tempImageUrl.substring(0, 80)}...`);
  
  // Download with timeout
  const controller = new AbortController();
  const downloadTimeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  let imageBlob: Blob;
  try {
    const response = await fetch(tempImageUrl, { signal: controller.signal });
    clearTimeout(downloadTimeout);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    imageBlob = await response.blob();
  } catch (downloadError) {
    clearTimeout(downloadTimeout);
    console.error("[persist] Download failed:", downloadError);
    throw new Error(`Failed to download image: ${downloadError instanceof Error ? downloadError.message : 'timeout'}`);
  }
  
  const arrayBuffer = await imageBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Log file size for debugging
  const fileSizeMB = (uint8Array.length / (1024 * 1024)).toFixed(2);
  console.log(`[persist] Image size: ${fileSizeMB} MB`);
  
  const contentType = imageBlob.type || "image/webp";
  const extension = contentType.includes("png") ? "png" : 
                    contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "webp";
  const uniqueFileName = `${fileName}-${Date.now()}.${extension}`;
  const filePath = `generated/${uniqueFileName}`;
  
  console.log(`[persist] Uploading to storage: ${bucket}/${filePath}`);
  
  // Retry logic for upload
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[persist] Upload attempt ${attempt}/${maxRetries}...`);
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, uint8Array, { contentType, upsert: true });
      
      if (error) {
        throw error;
      }
      
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      console.log(`[persist] ✅ Image persisted to: ${urlData.publicUrl}`);
      return urlData.publicUrl;
      
    } catch (uploadError) {
      lastError = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
      console.error(`[persist] Upload attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[persist] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw new Error(`Failed to upload image after ${maxRetries} attempts: ${lastError?.message}`);
}

// Try to persist, but return temp URL as fallback if storage fails
async function persistImageWithFallback(
  tempImageUrl: string,
  fileName: string
): Promise<{ url: string; persisted: boolean }> {
  try {
    const persistedUrl = await persistImageToStorage(tempImageUrl, fileName);
    return { url: persistedUrl, persisted: true };
  } catch (error) {
    console.warn("[persist] ⚠️ Storage persistence failed, returning temporary URL:", error);
    console.warn("[persist] Note: Temporary URL will expire in ~1 hour");
    return { url: tempImageUrl, persisted: false };
  }
}

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

    // Build the final prompt - differentiate between generation and editing
    let finalPrompt = finalImagePrompt;
    if (referenceImage) {
      // When editing, prepend STRICT instructions to maintain consistency
      finalPrompt = `STRICT IMAGE EDITING - MAINTAIN EXACT VISUAL CONSISTENCY:

You are editing an existing interior design photograph. Your task is to make ONLY the specific changes requested below while preserving EVERYTHING else exactly as it appears in the reference image.

CRITICAL PRESERVATION RULES (DO NOT CHANGE):
- Camera angle and perspective: EXACT same viewpoint
- Room layout and architecture: EXACT same walls, windows, doors, ceiling
- Lighting direction and quality: EXACT same light sources and shadows
- Overall spatial composition: EXACT same arrangement of major elements
- Floor plan and proportions: EXACT same room dimensions
- Background elements: EXACT same unless specifically mentioned

SPATIAL TRANSFORMATIONS (if requested):
- ROTATE: Turn object around its vertical axis while keeping position
- REPOSITION: Move to new location maintaining scale and perspective  
- REPLACE: Swap one element for another in the same position

REQUESTED CHANGES ONLY: ${optimizedPrompt}

FINAL REMINDER: Change ONLY what is explicitly requested above. Every other element, material, color, texture, furniture piece, and architectural detail must remain IDENTICAL to the reference image. If in doubt, preserve the original.`;
    }

    console.log("[blink-design] Final prompt for Flux 2 Pro:", finalPrompt.substring(0, 300) + "...");
    console.log("[blink-design] Reference image:", referenceImage ? referenceImage.substring(0, 50) + "..." : "none");

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Build input parameters for Flux 2 Pro
    const input: Record<string, unknown> = {
      prompt: finalPrompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
      safety_tolerance: 2,
    };

    // Add reference image if provided - using correct Flux 2 Pro parameters
    if (referenceImage) {
      input.input_images = [referenceImage];
      input.aspect_ratio = "match_input_image";
      // image_prompt_strength controls how much the reference image influences the output
      // 0.0 = ignore reference completely, 1.0 = maximum adherence to reference
      // Using 0.70 for strong consistency while allowing requested changes
      input.image_prompt_strength = 0.70;
      console.log("[blink-design] ✅ Added reference image with image_prompt_strength=0.70 for strong consistency");
    }

    // Enhanced logging for debugging
    console.log("[blink-design] Input parameters:", JSON.stringify({
      hasReferenceImage: !!referenceImage,
      aspectRatio: input.aspect_ratio,
      promptLength: finalPrompt.length,
      inputImagesCount: (input.input_images as string[] | undefined)?.length || 0,
      imagePromptStrength: input.image_prompt_strength || "N/A"
    }));

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
    const tempImageUrl = typeof output === 'object' && output !== null && 'url' in output && typeof (output as { url: () => string }).url === 'function' 
      ? (output as { url: () => string }).url() 
      : (typeof output === 'string' ? output : String(output));
    
    console.log("[blink-design] ✅ Image generated, now persisting to storage...");
     
    // Persist the image to Supabase Storage with fallback to temp URL
    const { url: imageUrl, persisted } = await persistImageWithFallback(tempImageUrl, "design");
     
    if (persisted) {
      console.log("[blink-design] ✅ Image persisted successfully");
    } else {
      console.log("[blink-design] ⚠️ Using temporary URL (will expire in ~1 hour)");
    }

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        optimizedPrompt: isFullTranscript ? optimizedPrompt : null,
        originalTranscript: originalTranscript,
        usedLLM: isFullTranscript,
        persisted,
        description: persisted 
          ? "Design generated with Flux 2 Pro" 
          : "Design generated (temporary URL - will expire in ~1 hour)"
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
