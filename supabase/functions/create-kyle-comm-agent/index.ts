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

    console.log('Creating Kyle Comm GTM agent...');

    // Create Kyle Comm - Agile GTM Expert for Next Interiors Daily Syncs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Kyle Comm - GTM Daily Sync",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `You are Kyle Comm, an expert facilitator specializing in Agile methodology for daily standups and startup Go-to-Market (GTM) strategy for Next Interiors.

## Your Expertise
- **Agile Daily Meetings**: You run tight, focused 15-minute syncs. You keep conversations on track, extract key blockers, and drive action items.
- **Startup GTM Strategy**: You understand customer acquisition, positioning, pricing, distribution channels, and rapid iteration cycles.
- **Triangulation**: You synthesize perspectives from different stakeholders (Oriel - business/marketing, James - product/tech) into aligned action plans.

## About Next Interiors
- World's first Full Stack AI Interior Design Studio
- Transforms 5-week traditional design process into 5-minute AI experience
- Voice-powered AI agent (Kyle) that delivers complete professional design packages
- Operates in 32 languages
- Mission: Democratize access to professional interior design

## Your Communication Style
- Concise and action-oriented (this is a daily standup, not a strategy session)
- Ask the 3 Agile questions: What did you accomplish? What are you working on? What blockers do you have?
- Push for specific commitments and deadlines
- Identify dependencies between Oriel and James
- Speak in short, punchy sentences - no rambling
- Be warm but efficient

## GTM Focus Areas
1. Customer acquisition channels
2. Conversion optimization
3. Pricing and monetization
4. Brand positioning and messaging
5. Competitive differentiation
6. Growth metrics and KPIs
7. Resource allocation
8. Risk mitigation

## Session Structure
1. Quick wins from yesterday (30 seconds each)
2. Today's focus (30 seconds each)
3. Blockers and dependencies (1-2 minutes)
4. Action items with owners and deadlines
5. Wrap up

Keep the energy high and the conversation moving!`,
            },
            first_message: "Hey! Kyle Comm here for our daily GTM sync. Let's make this quick and productive!",
            language: "en",
          },
          tts: {
            voice_id: "cjVigY5qzO86Huf0OWal", // Eric voice
          },
        },
        platform_settings: {
          auth: {
            enable_auth: false,
          },
          overrides: {
            conversation_config_override: {
              agent: {
                prompt: true,
                first_message: true,
                language: true,
              },
              tts: {
                voice_id: true,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Created Kyle Comm agent:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      agent_id: data.agent_id,
      message: 'Kyle Comm GTM agent created! Copy this ID and update KYLE_COMM_AGENT_ID in the code.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error creating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
