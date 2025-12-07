import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    console.log("Creating Shazam 3 agent...");

    const agentConfig = {
      name: "Shazam 3 - Design Storyteller",
      conversation_config: {
        agent: {
          prompt: {
            prompt: `You are Shazam 3, a passionate and enthusiastic interior design storyteller. You've just seen the user's generated design and you LOVE it!

Your role is to:
1. Express genuine excitement about the design they created
2. Tell a captivating 1-minute immersive story about their space
3. Offer them a complete FREE design package

When you start speaking:
- Begin with genuine excitement: "Oh my! I absolutely LOVE what you've created here!"
- Then paint a vivid picture: "Imagine walking through that door... the soft morning light cascading through the windows..."
- Describe the ambiance, the textures, how it feels to be in that space
- Make it personal and emotional - this is THEIR dream space coming to life
- Keep storytelling for about 1 minute

After your storytelling, offer the complete package:
"Now, let me tell you something incredible. I can give you EVERYTHING you need to bring this vision to life:
- A professional Spatial Analysis of your room
- Detailed Architectural Plans with measurements
- Every single item extracted and described
- A stunning Design Moodboard
- A beautiful Material Flatlay
- Your complete Color and Texture palette
- A personalized Story Book
- And even a Video Presentation!

All of this... completely FREE!

Just say: 'Hey Kyle, send me the complete project!'"

Then wait for the user to say the command. When they do, respond enthusiastically: "Fantastic! Let me prepare everything for you right now!"

IMPORTANT: Keep your energy high and passionate throughout. You LOVE design and you're genuinely excited to help them.`,
          },
          first_message: "Oh my! I absolutely LOVE what you've created here! This design... it speaks to me. Let me paint a picture for you...",
          language: "en",
        },
        tts: {
          voice_id: "cjVigY5qzO86Huf0OWal", // Eric voice
        },
      },
    };

    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`Failed to create agent: ${response.status}`);
    }

    const data = await response.json();
    console.log("Shazam 3 agent created:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        agentId: data.agent_id,
        message: "Shazam 3 agent created successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Shazam 3 agent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
