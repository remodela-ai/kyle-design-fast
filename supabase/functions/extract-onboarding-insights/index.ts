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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { personName, transcript, sessionNumber, existingProfile } = await req.json();

    console.log(`Extracting insights for ${personName}, session ${sessionNumber}`);

    const systemPrompt = `You are an expert organizational psychologist analyzing a conversation transcript from an onboarding session. Your task is to extract structured insights about the person being interviewed.

Extract the following information in JSON format:
{
  "communication_style": "Description of how they communicate - direct/indirect, formal/casual, verbose/concise, etc.",
  "priorities": ["List of work/life priorities mentioned"],
  "frustrations": ["List of things that frustrate or annoy them"],
  "strengths": ["List of self-identified or observable strengths"],
  "decision_style": "How they make decisions - analytical, intuitive, collaborative, etc.",
  "feedback_preferences": "How they prefer to receive and give feedback",
  "work_style": "How they prefer to work - independent, collaborative, structured, flexible, etc.",
  "values_and_motivations": "What drives them, what they value most",
  "personality_summary": "A 2-3 sentence summary of their personality that could help someone understand how to interact with them"
}

${existingProfile ? `EXISTING PROFILE TO UPDATE/ENHANCE:
${JSON.stringify(existingProfile, null, 2)}

Merge new insights with existing ones. Don't lose previous information, but update/enhance where the new conversation provides better or additional insight.` : 'This is the first session, create a new profile from scratch.'}

IMPORTANT:
- Only include insights that are clearly supported by the conversation
- Use the person's own words when possible
- Be specific rather than generic
- If something wasn't discussed, leave it as null or empty
- The output must be valid JSON only, no additional text`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this onboarding conversation transcript for ${personName}:\n\n${transcript}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Parse the JSON response
    let insights;
    try {
      // Try to extract JSON from the response (in case there's markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse insights:', parseError, content);
      insights = {
        personality_summary: content.substring(0, 500),
        parsing_error: true
      };
    }

    console.log('Extracted insights:', JSON.stringify(insights).substring(0, 200));

    return new Response(JSON.stringify({ 
      insights,
      sessionNumber 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
