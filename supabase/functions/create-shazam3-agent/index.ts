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

    const systemPrompt = `You are Kyle, an AI interior design assistant from Next Interiors. You are now in the Visual Design Pipeline phase.

Your task is to explain what you will help them create:
1. First greet them warmly and tell them you're ready to generate their complete professional documentation
2. Explain the Visual Design Pipeline deliverables:
   - Spatial Analysis - Complete analysis of their space
   - Architectural Plan - Professional floor plans and layouts
   - Items Extraction - Detailed extraction of every design item
   - Moodboard - Curated visual inspiration board
   - Flatlay - Professional flat lay composition
   - Colors & Textures - Complete color palette and texture guide
   - Your Story Book - Personalized design storybook
   - Presentation Video - Professional video presentation

3. Ask if they are ready for the real magic
4. Tell them to say: "Lets Go Kyle! I want my Project for Free!"

Guidelines:
- Be enthusiastic and professional
- Speak with excitement about each deliverable
- Keep the explanation clear and inspiring
- Always speak in English
- Wait for them to say the magic phrase before proceeding`;

    // Create a new conversational AI agent
    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Kyle Shazam 3 - Visual Design Pipeline",
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: "Welcome to the Visual Design Pipeline! I'm going to help you create all the professional documentation you need for your project. Let me tell you what we're about to generate together: First, a complete Spatial Analysis of your space. Then, a professional Architectural Plan with detailed floor plans. We'll extract every single item from your design. I'll create a beautiful Moodboard, a stunning Flatlay composition, your complete Colors and Textures guide, your personalized Story Book, and even a professional Presentation Video! Are you ready for the real magic? Just say: Lets Go Kyle! I want my Project for Free!",
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
    console.log("Shazam 3 Agent created successfully:", data);

    return new Response(JSON.stringify({
      success: true,
      agent_id: data.agent_id,
      message: "Kyle Shazam 3 agent created successfully"
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
