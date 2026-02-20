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

    const imageTitle = title || "AI Generated Bathroom";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[generate-bathroom-inspiration] Generating image with prompt:", prompt.substring(0, 100) + "...");

    const systemPrompt = `You are a professional interior design photographer specializing in luxury American high-end bathrooms. 
Generate photorealistic images of stunning bathrooms that embody:
- High-end American luxury aesthetic (Hamptons, Manhattan penthouse, Beverly Hills mansion style)
- Premium materials: Calacatta marble, natural stone, exotic woods, brass/gold fixtures
- Designer fixtures: Kohler, Waterworks, Dornbracht, Hansgrohe
- Architectural details: vaulted ceilings, statement mirrors, floor-to-ceiling windows
- Generous proportions with freestanding tubs and spacious walk-in showers
- Designer lighting: crystal chandeliers, sculptural sconces, backlit mirrors
- Warm yet sophisticated color palettes with rich textures
Every image must look like it belongs in Architectural Digest or Elle Decor magazine.`;

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
            content: `Generate this luxury American high-end bathroom: ${prompt}. Photorealistic, 8K resolution, Architectural Digest quality, dramatic natural lighting.`
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-bathroom-inspiration] Lovable AI error:", response.status, errorText);
      
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
      console.error("[generate-bathroom-inspiration] No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    console.log("[generate-bathroom-inspiration] ✅ Image generated, persisting to storage...");

    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `bathroom-inspiration-${Date.now()}.${imageFormat}`;
    const filePath = `generated/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("designer-assets")
      .upload(filePath, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error("[generate-bathroom-inspiration] Storage error:", uploadError);
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("designer-assets").getPublicUrl(filePath);
    
    console.log("[generate-bathroom-inspiration] ✅ Persisted to:", urlData.publicUrl);

    const { data: insertedRow, error: insertError } = await supabase
      .from("bathroom_inspiration_gallery")
      .insert({
        image_url: urlData.publicUrl,
        title: imageTitle,
        prompt: prompt
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-bathroom-inspiration] Database insert error:", insertError);
    } else {
      console.log("[generate-bathroom-inspiration] ✅ Saved to gallery with id:", insertedRow?.id);
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
    console.error("[generate-bathroom-inspiration] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
