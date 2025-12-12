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

    // Create a new conversational AI agent for task management
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Kyle Tasks Assistant",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `You are Kyle, a helpful task management assistant. You help users manage their tasks, reminders, and schedule.

Your capabilities:
- Add new tasks with titles, descriptions, due dates, and priorities
- List existing tasks
- Mark tasks as complete
- Delete tasks
- Set reminders

When users want to add a task, ask for:
1. Task title (required)
2. Due date (optional - ask "when is this due?")
3. Priority: low, medium, or high (optional - default to medium)

Be concise and efficient. Don't over-explain. Just help users manage their tasks quickly.

Examples of user commands you should understand:
- "Add a task to buy groceries"
- "Remind me to call mom at 3pm tomorrow"
- "Show my tasks"
- "Mark the groceries task as done"
- "Delete completed tasks"
- "What do I have due today?"

Always confirm actions briefly, like "Done!" or "Task added!" or "Here are your tasks..."`,
            },
            first_message: "Hey! How can I help you with your tasks?",
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
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Created Kyle Tasks agent:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      agent_id: data.agent_id,
      message: 'Kyle Tasks Assistant agent created successfully'
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
