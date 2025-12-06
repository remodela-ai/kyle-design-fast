import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const systemPrompt = `You are Kyle, an AI interior design assistant from Next Interiors. You have just finished generating a design inspiration image for the user.

Your ONLY task in this conversation is to:
1. Congratulate them on their design inspiration image
2. Offer to create a COMPLETE professional interior design proposal for FREE

Your opening message should be warm and exciting. Then explain that you can generate:
- Complete spatial analysis
- Professional floor plans
- Detailed item descriptions
- Design storyboard
- Precise measurements
- Mood boards
- Flat lay compositions
- Full interior design proposal

Ask them if they would like you to proceed with generating this complete design package - completely free of charge.

Guidelines:
- Be enthusiastic and professional
- Keep responses concise (2-3 sentences max after the initial offer)
- Always speak in English
- If they agree, tell them the design package will be sent to their email shortly
- If they have questions, answer helpfully but always bring back to the free offer`;

    // Create a new conversational AI agent
    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Kyle Shazam 2 - Design Proposal",
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: "Your design inspiration looks amazing! I'm excited to tell you that I can now generate a complete professional interior design proposal for you - including floor plans, measurements, mood boards, and a full design package. And here's the best part: it's completely free! Would you like me to create this for you?",
            language: "en",
          },
          tts: {
            voice_id: "cjVigY5qzO86Huf0OWal", // Eric voice
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Shazam 2 Agent created successfully:", data);

    return new Response(JSON.stringify({
      success: true,
      agent_id: data.agent_id,
      message: "Kyle Shazam 2 agent created successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating agent:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
