 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
 
 interface ParsedCommand {
   action: 'create_task' | 'complete_task' | 'delete_task' | 'list_tasks' | 'set_alarm' | 
            'search_products' | 'send_message' | 'check_status' | 'generate_proposal' | 'list_leads' | 'unknown';
   title?: string;
   description?: string;
   due_date?: string;
   priority?: 'low' | 'medium' | 'high';
   time?: string;
   label?: string;
   recurrence?: 'none' | 'daily' | 'weekly';
   recurrence_days?: string[];
   task_id?: string;
   product_query?: string;
   client_name?: string;
   message_content?: string;
   send_email?: boolean;
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { userMessage, conversationHistory, office_id } = await req.json();
     console.log('[kyle-tasks-ai] Processing:', userMessage);
     console.log('[kyle-tasks-ai] Office ID:', office_id);
 
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
 
     // Get leads for the office if office_id provided
     let leads: any[] = [];
     if (office_id) {
       const { data: leadsData } = await supabase
         .from('leads')
         .select('id, name, email, phone, project_type, status, budget_min, budget_max, created_at, assigned_to')
         .eq('office_id', office_id)
         .order('created_at', { ascending: false })
         .limit(20);
       leads = leadsData || [];
     }
 
     // Get today's leads
     const todayStart = new Date();
     todayStart.setHours(0, 0, 0, 0);
     const todaysLeads = leads.filter(l => new Date(l.created_at) >= todayStart);
 
     const todayDate = new Date().toISOString().split('T')[0];
     const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
 
     const systemPrompt = `You are Kyle, a helpful design studio assistant. You help designers manage their work, communicate with clients, and find products.
 
 Current date: ${todayDate}
 Current time: ${currentTime}
 
 Current pending tasks:
 ${tasks?.length ? tasks.map(t => `- "${t.title}" (${t.priority} priority, ID: ${t.id})`).join('\n') : 'No pending tasks'}
 
 Current active alarms:
 ${alarms?.length ? alarms.map(a => `- ${a.time} "${a.label}" (${a.recurrence}, ID: ${a.id})`).join('\n') : 'No active alarms'}
 
 Current leads/clients (most recent):
 ${leads?.length ? leads.slice(0, 10).map(l => `- "${l.name || 'Unknown'}" (${l.project_type || 'General'}, Status: ${l.status}, ID: ${l.id})`).join('\n') : 'No leads found'}
 
 Today's new leads: ${todaysLeads.length} new leads today
 
 IMPORTANT: You must use the parse_command tool to respond. Analyze the user's message and extract the command.
 
 AVAILABLE COMMANDS:
 1. Task Management: create_task, complete_task, delete_task, list_tasks, set_alarm
 2. Product Search: "search for [product]" → action: search_products, product_query: the search terms
 3. Client Messaging: "message [client] saying [message]" → action: send_message, client_name, message_content
 4. Status Check: "what's the status of [client]'s project?" → action: check_status, client_name
 5. Proposal Generation: "generate a proposal for [client]" → action: generate_proposal, client_name
 6. Lead Listing: "show me today's leads" → action: list_leads
 
 For task creation:
 - Extract title from what user wants to do
 - If user mentions "today", use today's date: ${todayDate}
 - If user mentions "tomorrow", add 1 day to today
 - Priority defaults to "medium" unless specified
 
 For alarms:
 - Extract time in 24h format (HH:MM)
 - If user says "daily", set recurrence to "daily"
 
 For product search:
 - Extract the product description with style, material, brand preferences
 
 For messaging clients:
 - Find the client by name from the leads list
 - Extract the message content to send
 
 For status check:
 - Find the client by name and return their status
 
 For proposals:
 - Find the client by name from leads list`;
 
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
                     enum: ["create_task", "complete_task", "delete_task", "list_tasks", "set_alarm", 
                            "search_products", "send_message", "check_status", "generate_proposal", "list_leads", "unknown"],
                     description: "The type of action to perform"
                   },
                   title: { type: "string", description: "Task title or name" },
                   description: { type: "string", description: "Task description" },
                   due_date: { type: "string", description: "Due date in ISO format" },
                   priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
                   task_id: { type: "string", description: "ID of existing task" },
                   time: { type: "string", description: "Alarm time in HH:MM format" },
                   label: { type: "string", description: "Alarm label" },
                   recurrence: { type: "string", enum: ["none", "daily", "weekly"], description: "Alarm recurrence" },
                   recurrence_days: { type: "array", items: { type: "string" }, description: "Days for weekly recurrence" },
                   product_query: { type: "string", description: "Product search query" },
                   client_name: { type: "string", description: "Name of the client/lead" },
                   message_content: { type: "string", description: "Message content to send" },
                   send_email: { type: "boolean", description: "Whether to send email" }
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
       console.error("[kyle-tasks-ai] AI gateway error:", response.status, errorText);
       throw new Error(`AI gateway error: ${response.status}`);
     }
 
     const aiResult = await response.json();
     console.log("[kyle-tasks-ai] AI response:", JSON.stringify(aiResult, null, 2));
 
     const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
     if (!toolCall) {
       return new Response(JSON.stringify({ 
         success: false, 
         message: "I couldn't understand that. Try 'search for marble countertops', 'message John saying hello', or 'show me today's leads'" 
       }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     }
 
     const parsed: ParsedCommand = JSON.parse(toolCall.function.arguments);
     console.log("[kyle-tasks-ai] Parsed command:", parsed);
 
     let result;
 
     switch (parsed.action) {
       case 'create_task': {
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
           message: `Task "${parsed.title}" created${parsed.due_date ? ` for ${new Date(parsed.due_date).toLocaleString()}` : ''}` 
         };
         break;
       }
 
       case 'complete_task': {
         if (parsed.task_id) {
           const { error } = await supabase.from('tasks').update({ is_completed: true }).eq('id', parsed.task_id);
           if (error) throw error;
           result = { success: true, action: 'complete_task', message: 'Task marked as complete' };
         } else {
           result = { success: false, message: "I couldn't find that task" };
         }
         break;
       }
 
       case 'delete_task': {
         if (parsed.task_id) {
           const { error } = await supabase.from('tasks').delete().eq('id', parsed.task_id);
           if (error) throw error;
           result = { success: true, action: 'delete_task', message: 'Task deleted' };
         } else {
           result = { success: false, message: "I couldn't find that task" };
         }
         break;
       }
 
       case 'list_tasks': {
         if (!tasks?.length) {
           result = { success: true, action: 'list_tasks', tasks: [], message: "You have no pending tasks" };
         } else {
           const taskList = tasks.map(t => `${t.title} (${t.priority})`).join(", ");
           result = { success: true, action: 'list_tasks', tasks, message: `You have ${tasks.length} tasks: ${taskList}` };
         }
         break;
       }
 
       case 'set_alarm': {
         const { error } = await supabase.from('alarms').insert({
           time: parsed.time,
           label: parsed.label || "Alarm",
           is_active: true,
           recurrence: parsed.recurrence || 'none',
           recurrence_days: parsed.recurrence_days || null,
         });
         if (error) throw error;
         
         let msg = `Alarm set for ${parsed.time}`;
         if (parsed.label) msg += ` - ${parsed.label}`;
         if (parsed.recurrence === 'daily') msg += ` (repeats daily)`;
         result = { success: true, action: 'set_alarm', message: msg };
         break;
       }
 
       case 'search_products': {
         if (!parsed.product_query) {
           result = { success: false, action: 'search_products', message: "What would you like me to search for?" };
           break;
         }
         if (!office_id) {
           result = { success: false, action: 'search_products', message: "I need your office context to search products." };
           break;
         }
         
         try {
           const searchResponse = await fetch(`${supabaseUrl}/functions/v1/kyle-product-search`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
             body: JSON.stringify({ query: parsed.product_query, office_id })
           });
           
           const searchData = await searchResponse.json();
           console.log("[kyle-tasks-ai] Product search result:", searchData);
           
           if (searchData.success && searchData.recommendations?.length > 0) {
             const top3 = searchData.recommendations.slice(0, 3);
             const summary = top3.map((r: any) => 
               `${r.vendor_name} at ${r.style_match_score}% match`
             ).join(', ');
             result = {
               success: true,
               action: 'search_products',
               data: searchData,
               message: `Found ${searchData.total_results} vendors for "${parsed.product_query}". Top matches: ${summary}`
             };
           } else {
             result = {
               success: true,
               action: 'search_products',
               data: searchData,
               message: `No vendors found for "${parsed.product_query}". Try a different search or add vendors to your catalog.`
             };
           }
         } catch (e) {
           console.error("[kyle-tasks-ai] Product search error:", e);
           result = { success: false, action: 'search_products', message: "I had trouble searching. Please try again." };
         }
         break;
       }
 
       case 'send_message': {
         if (!parsed.client_name || !parsed.message_content) {
           result = { success: false, action: 'send_message', message: "I need both a client name and message to send." };
           break;
         }
         
         const matchedLead = leads.find(l => l.name?.toLowerCase().includes(parsed.client_name!.toLowerCase()));
         
         if (!matchedLead) {
           const names = leads.slice(0, 5).map(l => l.name || 'Unknown').join(', ');
           result = { success: false, action: 'send_message', message: `Couldn't find "${parsed.client_name}". Available: ${names}` };
           break;
         }
         
         try {
           const msgResponse = await fetch(`${supabaseUrl}/functions/v1/kyle-send-message`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
             body: JSON.stringify({
               lead_id: matchedLead.id,
               content: parsed.message_content,
               sender: 'kyle',
               send_email: parsed.send_email || false
             })
           });
           
           const msgData = await msgResponse.json();
           if (msgData.success) {
             let confirmMsg = `Message sent to ${matchedLead.name}`;
             if (msgData.email_sent) confirmMsg += ' and email delivered';
             result = { success: true, action: 'send_message', data: msgData, message: confirmMsg };
           } else {
             result = { success: false, action: 'send_message', message: "Failed to send message. Please try again." };
           }
         } catch (e) {
           console.error("[kyle-tasks-ai] Send message error:", e);
           result = { success: false, action: 'send_message', message: "I had trouble sending that message." };
         }
         break;
       }
 
       case 'check_status': {
         if (!parsed.client_name) {
           result = { success: false, action: 'check_status', message: "Which client's status would you like to check?" };
           break;
         }
         
         const statusLead = leads.find(l => l.name?.toLowerCase().includes(parsed.client_name!.toLowerCase()));
         
         if (!statusLead) {
           result = { success: false, action: 'check_status', message: `Couldn't find a client named "${parsed.client_name}".` };
           break;
         }
         
         const statusLabels: Record<string, string> = {
           'new': 'new lead, not yet contacted',
           'qualified': 'qualified and ready for follow-up',
           'contacted': 'contacted, awaiting response',
           'proposal_sent': 'proposal sent, pending review',
           'converted': 'converted to client',
           'lost': 'marked as lost'
         };
         
         const budgetInfo = statusLead.budget_min || statusLead.budget_max 
           ? ` with budget $${statusLead.budget_min?.toLocaleString() || '?'} to $${statusLead.budget_max?.toLocaleString() || '?'}`
           : '';
         
         result = {
           success: true,
           action: 'check_status',
           lead: statusLead,
           message: `${statusLead.name}'s ${statusLead.project_type || 'project'} is ${statusLabels[statusLead.status] || statusLead.status}${budgetInfo}.`
         };
         break;
       }
 
       case 'generate_proposal': {
         if (!parsed.client_name) {
           result = { success: false, action: 'generate_proposal', message: "Which client should I generate a proposal for?" };
           break;
         }
         
         const proposalLead = leads.find(l => l.name?.toLowerCase().includes(parsed.client_name!.toLowerCase()));
         
         if (!proposalLead) {
           result = { success: false, action: 'generate_proposal', message: `Couldn't find "${parsed.client_name}".` };
           break;
         }
         
         result = {
           success: true,
           action: 'generate_proposal',
           lead: proposalLead,
           navigate_to: `/kustr/leads/${proposalLead.id}/proposal`,
           message: `Opening proposal for ${proposalLead.name}. Their ${proposalLead.project_type || 'project'} has budget $${proposalLead.budget_min?.toLocaleString() || '?'} to $${proposalLead.budget_max?.toLocaleString() || '?'}.`
         };
         break;
       }
 
       case 'list_leads': {
         if (todaysLeads.length === 0) {
           const recentLead = leads[0] ? `${leads[0].name || 'Unknown'} for ${leads[0].project_type || 'a project'}` : 'none';
           result = { 
             success: true, 
             action: 'list_leads', 
             leads: [], 
             message: `No new leads today. Most recent was ${recentLead}.`
           };
         } else {
           const names = todaysLeads.map(l => l.name || 'Unknown').join(', ');
           result = { 
             success: true, 
             action: 'list_leads', 
             leads: todaysLeads,
             message: `${todaysLeads.length} new lead${todaysLeads.length > 1 ? 's' : ''} today: ${names}.`
           };
         }
         break;
       }
 
       default:
         result = { 
           success: false, 
           action: 'unknown',
           message: "I can help with: tasks, product search, messaging clients, checking status, generating proposals, or listing today's leads." 
         };
     }
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
 
   } catch (error) {
     console.error('[kyle-tasks-ai] Error:', error);
     return new Response(JSON.stringify({ 
       success: false,
       error: error instanceof Error ? error.message : 'Unknown error' 
     }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   }
 });