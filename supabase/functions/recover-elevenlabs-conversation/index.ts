import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

interface ConversationMessage {
  role: string;
  message: string;
  time_in_call_secs: number;
}

interface ConversationDetails {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: ConversationMessage[];
  metadata: {
    start_time_unix_secs: number;
    call_duration_secs: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, conversationId, personName, sessionNumber } = await req.json();
    
    console.log('Recovering conversation:', { agentId, conversationId, personName, sessionNumber });

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let conversations: any[] = [];

    // If we have a specific conversation ID, fetch that one
    if (conversationId) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`);
      }

      const details: ConversationDetails = await response.json();
      conversations = [details];
    } 
    // Otherwise, list recent conversations for the agent
    else if (agentId) {
      // First get the list of conversations
      const listResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}`,
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error(`Failed to list conversations: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      
      // Fetch details for each conversation
      for (const conv of listData.conversations || []) {
        const detailResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (detailResponse.ok) {
          const details = await detailResponse.json();
          conversations.push(details);
        }
      }
    } else {
      // List all recent conversations (last 24 hours)
      const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
      
      const listResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?call_start_after_unix=${oneDayAgo}`,
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error(`Failed to list conversations: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      console.log(`Found ${listData.conversations?.length || 0} conversations in last 24h`);
      
      // Fetch details for each
      for (const conv of listData.conversations || []) {
        const detailResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
          {
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
          }
        );

        if (detailResponse.ok) {
          const details = await detailResponse.json();
          conversations.push(details);
        }
      }
    }

    // Process and save each conversation
    const savedSessions = [];
    
    for (const conv of conversations) {
      if (!conv.transcript || conv.transcript.length === 0) {
        console.log(`Skipping conversation ${conv.conversation_id} - no transcript`);
        continue;
      }

      // Format transcript
      const formattedTranscript = conv.transcript
        .map((msg: ConversationMessage) => {
          const speaker = msg.role === 'user' ? (personName || 'User') : 'Kyle';
          return `${speaker}: ${msg.message}`;
        })
        .join('\n\n');

      // Check if this conversation was already saved
      const { data: existing } = await supabase
        .from('onboarding_sessions')
        .select('id')
        .eq('conversation_transcript', formattedTranscript)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Conversation ${conv.conversation_id} already saved`);
        continue;
      }

      // Save to database
      const sessionData = {
        person_name: personName || 'Unknown',
        session_number: sessionNumber || 1,
        conversation_transcript: formattedTranscript,
        session_focus: `Recovered session from ${new Date(conv.metadata.start_time_unix_secs * 1000).toLocaleString()}`,
        extracted_insights: {
          conversation_id: conv.conversation_id,
          agent_id: conv.agent_id,
          duration_secs: conv.metadata.call_duration_secs,
          status: conv.status,
          recovered_at: new Date().toISOString(),
        }
      };

      const { data: saved, error: saveError } = await supabase
        .from('onboarding_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving session:', saveError);
      } else {
        savedSessions.push({
          id: saved.id,
          conversation_id: conv.conversation_id,
          duration: conv.metadata.call_duration_secs,
          messages: conv.transcript.length,
        });
        console.log(`Saved conversation ${conv.conversation_id}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      recovered: savedSessions.length,
      sessions: savedSessions,
      totalFound: conversations.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error recovering conversations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
