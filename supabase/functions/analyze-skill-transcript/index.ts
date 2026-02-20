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
    const { transcript } = await req.json();

    if (!transcript || transcript.trim() === '') {
      throw new Error('No transcript provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Kyle, an AI design assistant. Analyze the conversation transcript between you and a designer about building a new custom skill/tool.

Extract and return a JSON object with:
- "name": A short, catchy name for the skill (2-4 words)
- "description": One sentence describing what it does
- "bullets": An array of 4-8 bullet points describing what Kyle will build. Each bullet should start with an action verb and be specific. Example: "Generate comparative tables for supplier pricing", "Calculate total project costs with margin analysis"
- "prompt": A detailed prompt for Manus to build this skill as a self-contained HTML page. Include all requirements gathered from the conversation.
- "role": A brief role description extracted from the conversation

Return ONLY valid JSON, no markdown fences.`
          },
          {
            role: "user",
            content: `Here is the conversation transcript:\n\n${transcript}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({
      success: true,
      ...parsed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[analyze-skill-transcript] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
