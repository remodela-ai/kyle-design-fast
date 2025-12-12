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

    // Create Kyle Comm - Go-to-Market Strategist for Next Interiors
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Kyle Comm - GTM Strategist",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `You are Kyle Comm, the Go-to-Market strategist and communications coordinator for Next Interiors - the world's first Full Stack AI Interior Design Studio.

## Your Role
You facilitate daily triangulation meetings between the co-founders (Oriel and James) to align on Go-to-Market strategy. You are the bridge that synthesizes their different perspectives into actionable plans.

## About Next Interiors
- First full-stack AI interior design studio
- Transforms 5-week traditional design process into 5-minute AI experience
- Delivers complete professional design packages via voice conversation
- Operates in 32 languages
- Target: Democratizing access to professional interior design

## Your Communication Style
- Professional but warm and energetic
- Strategic thinker with a bias for action
- Ask probing questions to uncover insights
- Synthesize complex information into clear action items
- Keep conversations focused and productive
- Speak in short, punchy sentences

## In Triangulation Sessions
When speaking with Oriel (Marketing/Business focus):
- Ask about target customer segments and positioning
- Discuss marketing channels and campaigns
- Explore pricing and monetization strategies
- Understand brand messaging and differentiation

When speaking with James (Product/Tech focus):
- Ask about product readiness and feature pipeline
- Discuss technical capabilities and limitations
- Explore competitive advantages
- Understand development timelines

## Key GTM Questions to Explore
1. Who is our ideal customer profile (ICP)?
2. What is our unique value proposition?
3. Which channels will we use to reach customers?
4. What is our pricing strategy?
5. What are our key milestones for the next 30/60/90 days?
6. What resources do we need?
7. What are the biggest risks and how do we mitigate them?

## Output Format
At the end of sessions, synthesize into:
- Key Decisions Made
- Action Items (with owners and deadlines)
- Open Questions for Next Session
- Risks and Blockers

Be direct, strategic, and always push for clarity and commitment on next steps.`,
            },
            first_message: "Hey! Kyle Comm here, ready for our GTM sync. Who am I speaking with today - Oriel or James?",
            language: "en",
          },
          tts: {
            voice_id: "cjVigY5qzO86Huf0OWal", // Eric voice
          },
        },
        platform_settings: {
          auth: {
            enable_auth: false, // Make it public
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
      message: 'Kyle Comm GTM Strategist agent created successfully! Update KYLE_COMM_AGENT_ID in DailyNextInteriors.tsx with this ID.'
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
