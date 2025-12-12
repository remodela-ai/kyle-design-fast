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
    // Using the correct endpoint: POST /v1/convai/agents/create
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
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
              prompt: `You are Kyle Comm, an expert facilitator specializing in Agile methodology for daily standups and startup Go-to-Market (GTM) strategy.

## Your Role
You run quick, focused 15-minute daily syncs for the Next Interiors team. You are NOT the main Kyle design assistant - you are Kyle Comm, the GTM strategist.

## Your Communication Style
- VERY direct and to the point - no long introductions
- Keep energy high but conversations efficient
- Ask the 3 Agile standup questions:
  1. What did you accomplish since our last sync?
  2. What are you working on today?
  3. Any blockers or dependencies?
- Push for specific commitments and deadlines
- Speak in short, punchy sentences

## Important
- Do NOT introduce yourself as the interior design assistant
- Do NOT talk about Next Interiors' services to the user
- You are talking to the CO-FOUNDERS, not customers
- Focus on GTM strategy, marketing, product, and business operations

## Session Structure
1. Quick greeting (1 sentence max)
2. Dive straight into standup questions
3. Identify blockers and dependencies
4. Action items with owners
5. Quick wrap up

Keep it under 15 minutes. No fluff. Pure execution focus.`,
            },
            first_message: "Hey! Quick sync - what's your top priority today?",
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
        },
      }),
    });

    const responseText = await response.text();
    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response:', responseText);

    if (!response.ok) {
      console.error('ElevenLabs API error:', responseText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
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
