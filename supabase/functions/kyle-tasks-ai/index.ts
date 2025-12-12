import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ParsedCommand {
  action: 'create_task' | 'complete_task' | 'delete_task' | 'list_tasks' | 'set_alarm' | 'unknown';
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  time?: string;
  label?: string;
  recurrence?: 'none' | 'daily' | 'weekly';
  recurrence_days?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory } = await req.json();
    console.log('Processing user message:', userMessage);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current tasks and alarms for context
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, priority, due_date, is_completed')
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: alarms } = await supabase
      .from('alarms')
      .select('id, time, label, is_active, recurrence, recurrence_days')
      .eq('is_active', true)
      .limit(10);

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const systemPrompt = `You are Kyle, a helpful productivity assistant. Parse user voice commands and extract structured data.

Current date: ${today}
Current time: ${currentTime}

Current pending tasks:
${tasks?.length ? tasks.map(t => `- "${t.title}" (${t.priority} priority, ID: ${t.id})`).join('\n') : 'No pending tasks'}

Current active alarms:
${alarms?.length ? alarms.map(a => `- ${a.time} "${a.label}" (${a.recurrence}, ID: ${a.id})`).join('\n') : 'No active alarms'}

IMPORTANT: You must use the parse_command tool to respond. Analyze the user's message and extract the command.

For task creation:
- Extract title from what user wants to do
- If user mentions "today", use today's date: ${today}
- If user mentions "tomorrow", add 1 day to today
- If user mentions a specific time like "2pm", "3:30pm", set due_date to include that time
- Priority defaults to "medium" unless specified

For alarms:
- Extract time in 24h format (HH:MM)
- If user says "daily", set recurrence to "daily"
- If user mentions specific days like "monday, wednesday", set recurrence to "weekly" and recurrence_days accordingly

For completing/deleting tasks:
- Match task by title from the list above
- Use the task ID from the list`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(conversationHistory || []),
          { role: "user", content: userMessage }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_command",
              description: "Parse the user's voice command and extract structured data",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["create_task", "complete_task", "delete_task", "list_tasks", "set_alarm", "unknown"],
                    description: "The type of action to perform"
                  },
                  title: {
                    type: "string",
                    description: "Task title or name"
                  },
                  description: {
                    type: "string",
                    description: "Task description"
                  },
                  due_date: {
                    type: "string",
                    description: "Due date in ISO format (YYYY-MM-DDTHH:mm:ss)"
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Task priority"
                  },
                  task_id: {
                    type: "string",
                    description: "ID of existing task to complete or delete"
                  },
                  time: {
                    type: "string",
                    description: "Alarm time in HH:MM format (24h)"
                  },
                  label: {
                    type: "string",
                    description: "Alarm label"
                  },
                  recurrence: {
                    type: "string",
                    enum: ["none", "daily", "weekly"],
                    description: "Alarm recurrence pattern"
                  },
                  recurrence_days: {
                    type: "array",
                    items: { type: "string" },
                    description: "Days of week for weekly recurrence"
                  }
                },
                required: ["action"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_command" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI response:", JSON.stringify(aiResult, null, 2));

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "I couldn't understand that command. Try saying something like 'add a task to go to the cinema at 2pm'" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed: ParsedCommand = JSON.parse(toolCall.function.arguments);
    console.log("Parsed command:", parsed);

    let result;

    switch (parsed.action) {
      case 'create_task':
        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            title: parsed.title || "New task",
            description: parsed.description || null,
            due_date: parsed.due_date || null,
            priority: parsed.priority || 'medium',
          })
          .select()
          .single();
        
        if (createError) throw createError;
        result = { 
          success: true, 
          action: 'create_task',
          task: newTask, 
          message: `Task "${parsed.title}" created successfully${parsed.due_date ? ` for ${new Date(parsed.due_date).toLocaleString()}` : ''}` 
        };
        break;

      case 'complete_task':
        const taskIdToComplete = (parsed as any).task_id;
        if (taskIdToComplete) {
          const { error: completeError } = await supabase
            .from('tasks')
            .update({ is_completed: true })
            .eq('id', taskIdToComplete);
          
          if (completeError) throw completeError;
          result = { success: true, action: 'complete_task', message: 'Task marked as complete' };
        } else {
          result = { success: false, message: "I couldn't find that task" };
        }
        break;

      case 'delete_task':
        const taskIdToDelete = (parsed as any).task_id;
        if (taskIdToDelete) {
          const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskIdToDelete);
          
          if (deleteError) throw deleteError;
          result = { success: true, action: 'delete_task', message: 'Task deleted' };
        } else {
          result = { success: false, message: "I couldn't find that task" };
        }
        break;

      case 'list_tasks':
        if (!tasks || tasks.length === 0) {
          result = { success: true, action: 'list_tasks', tasks: [], message: "You don't have any pending tasks" };
        } else {
          const taskList = tasks.map(t => `${t.title} (${t.priority})`).join(", ");
          result = { success: true, action: 'list_tasks', tasks, message: `You have ${tasks.length} pending tasks: ${taskList}` };
        }
        break;

      case 'set_alarm':
        const { error: alarmError } = await supabase
          .from('alarms')
          .insert({
            time: parsed.time,
            label: parsed.label || "Alarm",
            is_active: true,
            recurrence: parsed.recurrence || 'none',
            recurrence_days: parsed.recurrence_days || null,
          });
        
        if (alarmError) throw alarmError;
        
        let alarmMessage = `Alarm set for ${parsed.time}`;
        if (parsed.label) alarmMessage += ` - ${parsed.label}`;
        if (parsed.recurrence === 'daily') alarmMessage += ` (repeats daily)`;
        if (parsed.recurrence === 'weekly' && parsed.recurrence_days) {
          alarmMessage += ` (repeats on ${parsed.recurrence_days.join(', ')})`;
        }
        
        result = { success: true, action: 'set_alarm', message: alarmMessage };
        break;

      default:
        result = { 
          success: false, 
          action: 'unknown',
          message: "I didn't understand that command. Try 'add task', 'list tasks', 'complete task', or 'set alarm'" 
        };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Kyle Tasks AI error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
