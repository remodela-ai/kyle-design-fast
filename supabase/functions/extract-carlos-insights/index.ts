import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all Carlos sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('onboarding_sessions')
      .select('conversation_transcript')
      .eq('person_name', 'Carlos')
      .not('conversation_transcript', 'is', null);

    if (sessionsError) throw sessionsError;

    // Combine all transcripts
    const allTranscripts = sessions
      .map(s => s.conversation_transcript)
      .filter(Boolean)
      .join('\n\n---NEW SESSION---\n\n');

    console.log(`Processing ${sessions.length} sessions for Carlos`);

    // Use Lovable AI to extract insights
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a psychologist and communication expert. Analyze the following conversation transcripts and extract detailed insights about the person named Carlos. Return a JSON object with the following structure:
{
  "communication_style": "Detailed description of how Carlos communicates",
  "priorities": ["Priority 1", "Priority 2", ...],
  "frustrations": ["Frustration 1", "Frustration 2", ...],
  "strengths": ["Strength 1", "Strength 2", ...],
  "decision_style": "How Carlos makes decisions",
  "feedback_preferences": "How Carlos prefers to give and receive feedback",
  "work_style": "How Carlos works and collaborates",
  "values_and_motivations": "What drives and motivates Carlos",
  "personality_summary": "A comprehensive 2-3 paragraph summary of Carlos's personality, communication needs, and how to best work with him"
}

Be thorough and specific. Include examples from the conversations when relevant.`
          },
          {
            role: 'user',
            content: `Here are all conversation transcripts with Carlos:\n\n${allTranscripts}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_profile_insights',
              description: 'Extract structured profile insights from conversation analysis',
              parameters: {
                type: 'object',
                properties: {
                  communication_style: { type: 'string' },
                  priorities: { type: 'array', items: { type: 'string' } },
                  frustrations: { type: 'array', items: { type: 'string' } },
                  strengths: { type: 'array', items: { type: 'string' } },
                  decision_style: { type: 'string' },
                  feedback_preferences: { type: 'string' },
                  work_style: { type: 'string' },
                  values_and_motivations: { type: 'string' },
                  personality_summary: { type: 'string' }
                },
                required: ['communication_style', 'priorities', 'frustrations', 'strengths', 'decision_style', 'feedback_preferences', 'work_style', 'values_and_motivations', 'personality_summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_profile_insights' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const insights = JSON.parse(toolCall.function.arguments);
    console.log('Extracted insights:', insights);

    // Check if Carlos profile exists
    const { data: existingProfile } = await supabase
      .from('person_profiles')
      .select('id')
      .eq('person_name', 'Carlos')
      .single();

    // Update or create profile
    const profileData = {
      person_name: 'Carlos',
      communication_style: insights.communication_style,
      priorities: insights.priorities,
      frustrations: insights.frustrations,
      strengths: insights.strengths,
      decision_style: insights.decision_style,
      feedback_preferences: insights.feedback_preferences,
      work_style: insights.work_style,
      values_and_motivations: insights.values_and_motivations,
      personality_summary: insights.personality_summary,
      sessions_completed: sessions.length,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    };

    let savedProfile;
    if (existingProfile) {
      const { data, error } = await supabase
        .from('person_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();
      
      if (error) throw error;
      savedProfile = data;
    } else {
      const { data, error } = await supabase
        .from('person_profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (error) throw error;
      savedProfile = data;
    }

    return new Response(JSON.stringify({
      success: true,
      profile: savedProfile,
      sessionsAnalyzed: sessions.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting insights:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
