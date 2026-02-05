import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const kitchenStyles = [
  "Ultra-modern minimalist",
  "Scandinavian hygge",
  "Industrial loft",
  "French country",
  "Mediterranean coastal",
  "Art Deco glamour",
  "Japanese zen",
  "Mid-century modern",
  "Rustic farmhouse",
  "Contemporary luxury",
  "Bohemian eclectic",
  "Transitional classic",
  "Urban contemporary",
  "Hamptons coastal",
  "Tuscan villa",
  "Modern organic",
  "Hollywood regency",
  "Parisian chic",
];

const colorPalettes = [
  "warm whites with brass accents and walnut wood",
  "deep navy blue with gold hardware and marble",
  "sage green with natural oak and copper",
  "charcoal black with stainless steel and concrete",
  "creamy ivory with antique bronze and terracotta",
  "soft blush pink with rose gold and white quartz",
  "rich emerald green with black marble and chrome",
  "warm terracotta with cream and natural stone",
  "crisp white with matte black and blonde wood",
  "dusty blue with brushed nickel and carrara marble",
  "forest green with burnished brass and butcher block",
  "moody burgundy with aged brass and dark walnut",
  "pale gray with polished nickel and white oak",
  "warm taupe with oil-rubbed bronze and soapstone",
  "ocean teal with champagne gold and light marble",
];

const luxuryFeatures = [
  "Sub-Zero refrigeration, Wolf range, waterfall island",
  "La Cornue range, integrated wine storage, butler's pantry",
  "Gaggenau appliances, hidden pantry, statement lighting",
  "Miele appliances, pot filler, breakfast nook",
  "Viking professional range, double islands, ceiling-height cabinets",
  "custom hood, integrated espresso station, open shelving",
  "statement chandelier, marble backsplash, leather bar stools",
  "skylights, indoor herb garden, professional ventilation",
  "floor-to-ceiling windows, floating shelves, minimalist hardware",
  "beamed ceiling, farmhouse sink, antique lighting",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Pick random elements
    const style = kitchenStyles[Math.floor(Math.random() * kitchenStyles.length)];
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    const features = luxuryFeatures[Math.floor(Math.random() * luxuryFeatures.length)];

    const prompt = `Generate a stunning, photorealistic interior photograph of a ${style} luxury kitchen. 
Color palette: ${palette}. 
Features: ${features}.
The image should look like it belongs in Architectural Digest magazine - ultra high resolution, professional interior photography, dramatic natural lighting, impeccable styling. 
Show a wide-angle view that captures the full grandeur of the space. 8K quality, hyperrealistic.`;

    const title = `${style} Kitchen`;

    console.log("Generating kitchen with prompt:", prompt);

    // Call Lovable AI gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const base64Image = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!base64Image) {
      throw new Error("No image generated");
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `inspiration/random-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("designer-assets")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("designer-assets")
      .getPublicUrl(fileName);

    // Save to inspiration_gallery
    const { data: insertedRow, error: insertError } = await supabase
      .from("inspiration_gallery")
      .insert({
        image_url: urlData.publicUrl,
        title: title,
        prompt: prompt
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save to gallery: ${insertError.message}`);
    }

    console.log("Kitchen generated and saved:", insertedRow.id);

    return new Response(
      JSON.stringify({
        imageUrl: urlData.publicUrl,
        prompt,
        title,
        id: insertedRow.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
