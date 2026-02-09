import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MANUS_API_BASE = "https://api.manus.im/v1";

interface ManusTaskRequest {
  prompt: string;
  project_id?: string;
  attachments?: string[];
  connectors?: string[];
  webhook_url?: string;
}

interface KyleBridgeRequest {
  command: string;
  context?: {
    lead_id?: string;
    office_id?: string;
    conversation_transcript?: string;
    additional_context?: string;
  };
  action_type?: 'research' | 'create' | 'analyze' | 'automate';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY');
    if (!MANUS_API_KEY) {
      throw new Error('MANUS_API_KEY is not configured');
    }

    const body: KyleBridgeRequest = await req.json();
    const { command, context, action_type = 'research' } = body;

    if (!command) {
      throw new Error('Command is required');
    }

    console.log(`[kyle-manus-bridge] Received command: ${command}`);
    console.log(`[kyle-manus-bridge] Action type: ${action_type}`);
    console.log(`[kyle-manus-bridge] Context:`, context);

    // Build the enhanced prompt for Manus
    let enhancedPrompt = command;
    
    if (context) {
      const contextParts: string[] = [];
      
      if (context.lead_id) {
        contextParts.push(`Lead ID: ${context.lead_id}`);
      }
      if (context.office_id) {
        contextParts.push(`Office ID: ${context.office_id}`);
      }
      if (context.conversation_transcript) {
        contextParts.push(`Conversation context:\n${context.conversation_transcript}`);
      }
      if (context.additional_context) {
        contextParts.push(`Additional context: ${context.additional_context}`);
      }
      
      if (contextParts.length > 0) {
        enhancedPrompt = `${command}\n\n---CONTEXT---\n${contextParts.join('\n')}\n---END CONTEXT---`;
      }
    }

    // Create task in Manus
    const taskPayload: ManusTaskRequest = {
      prompt: enhancedPrompt,
    };

    console.log(`[kyle-manus-bridge] Creating Manus task with prompt length: ${enhancedPrompt.length}`);

    const taskResponse = await fetch(`${MANUS_API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      console.error(`[kyle-manus-bridge] Manus API error: ${taskResponse.status} - ${errorText}`);
      throw new Error(`Manus API error: ${taskResponse.status} - ${errorText}`);
    }

    const taskData = await taskResponse.json();
    console.log(`[kyle-manus-bridge] Task created:`, taskData);

    return new Response(JSON.stringify({
      success: true,
      task_id: taskData.id || taskData.task_id,
      status: taskData.status || 'created',
      message: 'Task created successfully in Manus',
      data: taskData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[kyle-manus-bridge] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
