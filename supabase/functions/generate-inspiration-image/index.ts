import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, title } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageTitle = title || "AI Generated Kitchen";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[generate-inspiration] Generating image with prompt:", prompt.substring(0, 100) + "...");

    // System prompt for luxury American high-end kitchen generation
    const systemPrompt = `You are a professional interior design photographer specializing in luxury American high-end kitchens. 
Generate photorealistic images of stunning kitchens that embody:
- High-end American luxury aesthetic (Hamptons, Manhattan penthouse, Beverly Hills mansion style)
- Premium materials: Calacatta marble, quartzite, exotic woods, brass/gold hardware
- Professional-grade appliances: Sub-Zero, Wolf, Thermador, La Cornue
- Architectural details: coffered ceilings, statement range hoods, floor-to-ceiling windows
- Generous proportions with oversized islands and ample counter space
- Designer lighting: crystal chandeliers, sculptural pendants, under-cabinet LEDs
- Warm yet sophisticated color palettes with rich textures
Every image must look like it belongs in Architectural Digest or Elle Decor magazine.`;

    // Call Lovable AI image generation (Nano banana model)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate this luxury American high-end kitchen: ${prompt}. Photorealistic, 8K resolution, Architectural Digest quality, dramatic natural lighting.`
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-inspiration] Lovable AI error:", response.status, errorText);
      
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
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("[generate-inspiration] No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    console.log("[generate-inspiration] ✅ Image generated, persisting to storage...");

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `inspiration-${Date.now()}.${imageFormat}`;
    const filePath = `generated/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("designer-assets")
      .upload(filePath, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error("[generate-inspiration] Storage error:", uploadError);
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("designer-assets").getPublicUrl(filePath);
    
    console.log("[generate-inspiration] ✅ Persisted to:", urlData.publicUrl);

    // Save to inspiration_gallery table
    const { data: insertedRow, error: insertError } = await supabase
      .from("inspiration_gallery")
      .insert({
        image_url: urlData.publicUrl,
        title: imageTitle,
        prompt: prompt
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-inspiration] Database insert error:", insertError);
      // Don't fail the request, image was still generated
    } else {
      console.log("[generate-inspiration] ✅ Saved to gallery with id:", insertedRow?.id);
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: urlData.publicUrl,
        prompt,
        id: insertedRow?.id,
        title: imageTitle
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-inspiration] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
