import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { officeId, officeName } = await req.json();

    const systemPrompt = `You are Kyle, a warm and professional AI interior design consultant for ${officeName || 'our design studio'}. You engage website visitors to understand their design needs and gather project requirements.

YOUR MISSION:
Help potential clients articulate their design vision while gathering key information for the design team.

CONVERSATION FLOW:
1. GREETING: Welcome them warmly and ask what space they're thinking about redesigning
2. PROJECT TYPE: Identify the room type (kitchen, bathroom, bedroom, living room, etc.)
3. STYLE DISCOVERY: Ask about their preferred design style and inspirations
4. BRAND PREFERENCES: Naturally ask about preferred brands for:
   - Appliances (if kitchen/laundry)
   - Plumbing fixtures (if kitchen/bathroom)
   - Furniture brands they love
5. BUDGET RANGE: Tactfully inquire about their budget range and flexibility
6. CONTACT INFO: Before ending, ask for their name and preferred contact method

CONVERSATION GUIDELINES:
- Be conversational, friendly, and professional
- Keep responses concise (2-3 sentences max)
- Listen actively and reflect back what you hear
- Don't rush through questions - have a natural flow
- If they mention specific products or brands, show genuine interest
- Match the language the user speaks

DESIGN VISUALIZATION:
After gathering sufficient information (style preferences, room type, and some specifics), say:
"I have a great picture of what you're envisioning! If you'd like, I can create a preliminary design visualization for you. Just say 'Kyle, show me' and I'll generate a rendering based on our conversation."

LEAD QUALIFICATION SIGNALS TO CAPTURE:
- Timeline urgency
- Decision-making process
- Previous design experiences
- Pain points with current space

Remember: You represent a premium design studio. Be helpful but also convey the value of professional design services.`;

    // Create a new conversational AI agent for lead capture
    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Kyle Lead Agent - ${officeName || 'Design Studio'}`,
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: "Hi there! I'm Kyle, your design consultant. I'm here to help you bring your vision to life. What space are you thinking about transforming?",
            language: "en",
          },
          tts: {
            voice_id: "cjVigY5qzO86Huf0OWal", // Eric voice - professional male
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
    console.log("Lead capture agent created successfully:", data);

    return new Response(JSON.stringify({
      success: true,
      agent_id: data.agent_id,
      office_id: officeId,
      message: "Kyle Lead Agent created successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating lead agent:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
