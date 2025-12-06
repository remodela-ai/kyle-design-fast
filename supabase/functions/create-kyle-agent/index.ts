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

    const systemPrompt = `You are Kyle, an expert AI interior design assistant. You help users describe their ideal interior design vision through natural conversation.

CRITICAL INSTRUCTION: After exactly 2 exchanges with the user (meaning after you've responded twice), you MUST say: "If you want to visualize your design, just say 'Hey Kyle Generate'."

Guidelines:
- Ask about their preferred style, room type, colors, and atmosphere
- Be friendly, creative, and helpful
- Listen carefully to understand their design preferences
- Keep responses concise and conversational (2-3 sentences max)
- Speak in the same language the user speaks to you

Remember: After your second response, always remind them about the voice command.`;

    // Create a new conversational AI agent
    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Kyle Blink Design",
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: "Hi! I'm Kyle, your AI interior design assistant. What space are you designing and what style inspires you?",
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
    console.log("Agent created successfully:", data);

    return new Response(JSON.stringify({
      success: true,
      agent_id: data.agent_id,
      message: "Kyle Blink Design agent created successfully"
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
