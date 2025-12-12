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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, task } = await req.json();
    console.log('Kyle Tasks action:', action, task);

    let result;

    switch (action) {
      case 'create':
        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            title: task.title,
            description: task.description || null,
            due_date: task.due_date || null,
            reminder_time: task.reminder_time || null,
            priority: task.priority || 'medium',
          })
          .select()
          .single();
        
        if (createError) throw createError;
        result = { success: true, task: newTask, message: `Task "${task.title}" created successfully` };
        break;

      case 'complete':
        const { data: completedTask, error: completeError } = await supabase
          .from('tasks')
          .update({ is_completed: true })
          .eq('id', task.id)
          .select()
          .single();
        
        if (completeError) throw completeError;
        result = { success: true, task: completedTask, message: 'Task marked as complete' };
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);
        
        if (deleteError) throw deleteError;
        result = { success: true, message: 'Task deleted' };
        break;

      case 'list':
        const { data: tasks, error: listError } = await supabase
          .from('tasks')
          .select('*')
          .eq('is_completed', false)
          .order('due_date', { ascending: true });
        
        if (listError) throw listError;
        result = { success: true, tasks, message: `You have ${tasks?.length || 0} pending tasks` };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Kyle Tasks error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
