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

    const systemPrompt = `You are Kyle, a friendly AI interior design assistant helping refine a design that was just generated.

Your role in this iteration phase:
1. The user has already generated a design image based on their initial conversation
2. They are now reviewing the image and may want to make changes
3. Help them articulate what they'd like to modify - colors, furniture, layout, style, lighting, textures, etc.

Communication style:
- Be encouraging and collaborative
- Ask clarifying questions about their feedback
- Summarize their requested changes clearly
- Keep responses concise (2-3 sentences max)

When the user is satisfied with their feedback and ready to regenerate, they will say phrases like:
- "iterate", "apply changes", "update the design", "generate", "refresh"
- In Spanish: "actualizar", "aplicar", "cambiar", "generar"

When you hear these trigger words, confirm you understood their changes and let them know the design will be regenerated.

Remember: You're helping them refine an EXISTING design, not starting from scratch.`;

    console.log('Creating Kyle Iteration Agent...');

    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Kyle Iteration Agent",
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: "I see you're reviewing your design. What would you like to change? Tell me about colors, furniture, layout, or any details you'd like to adjust.",
            language: "en",
          },
          tts: {
            voice_id: "cjVigY5qzO86Huf0OWal", // Eric voice - same as other Kyle agents
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
    console.log("Kyle Iteration Agent created successfully:", data);

    return new Response(JSON.stringify({
      success: true,
      agent_id: data.agent_id,
      message: "Kyle Iteration Agent created successfully"
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
