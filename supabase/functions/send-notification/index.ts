 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
 const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
 const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 type NotificationType = 'new_lead' | 'lead_assigned' | 'new_message' | 'proposal_viewed';
 
 interface NotificationRequest {
   type: NotificationType;
   lead_id?: string;
   proposal_id?: string;
   office_id: string;
   assigned_to?: string;
   message_preview?: string;
 }
 
 // Email templates with studio branding
 const emailTemplates = {
   new_lead: (data: { leadName: string; projectType: string; officeName: string }) => ({
     subject: `🎯 New Lead: ${data.leadName || 'New Prospect'}`,
     html: `
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
           <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
             <tr>
               <td align="center">
                 <table width="600" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
                   <!-- Header -->
                   <tr>
                     <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
                       <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                         🎯 New Lead Captured
                       </h1>
                       <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                         ${data.officeName}
                       </p>
                     </td>
                   </tr>
                   <!-- Content -->
                   <tr>
                     <td style="padding: 32px;">
                       <h2 style="margin: 0 0 16px 0; color: #f5f5f5; font-size: 20px;">
                         ${data.leadName || 'New Prospect'}
                       </h2>
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                         A new lead has been captured through Kyle. ${data.projectType ? `They're interested in a <strong style="color: #f5f5f5;">${data.projectType}</strong> project.` : ''}
                       </p>
                       <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                         View Lead Details →
                       </a>
                     </td>
                   </tr>
                   <!-- Footer -->
                   <tr>
                     <td style="background-color: #0a0a0a; padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
                       <p style="margin: 0; color: #525252; font-size: 12px;">
                         Kuester Design Studio • Powered by Kyle AI
                       </p>
                     </td>
                   </tr>
                 </table>
               </td>
             </tr>
           </table>
         </body>
       </html>
     `,
   }),
 
   lead_assigned: (data: { leadName: string; assigneeName: string; assignerName: string }) => ({
     subject: `📋 Lead Assigned: ${data.leadName || 'New Lead'}`,
     html: `
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
           <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
             <tr>
               <td align="center">
                 <table width="600" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
                   <!-- Header -->
                   <tr>
                     <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
                       <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                         📋 Lead Assigned to You
                       </h1>
                     </td>
                   </tr>
                   <!-- Content -->
                   <tr>
                     <td style="padding: 32px;">
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                         Hi ${data.assigneeName},
                       </p>
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                         ${data.assignerName || 'A team member'} has assigned <strong style="color: #f5f5f5;">${data.leadName || 'a new lead'}</strong> to you. 
                         Please review the lead details and follow up as soon as possible.
                       </p>
                       <a href="#" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                         View Lead →
                       </a>
                     </td>
                   </tr>
                   <!-- Footer -->
                   <tr>
                     <td style="background-color: #0a0a0a; padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
                       <p style="margin: 0; color: #525252; font-size: 12px;">
                         Kuester Design Studio • Lead Management
                       </p>
                     </td>
                   </tr>
                 </table>
               </td>
             </tr>
           </table>
         </body>
       </html>
     `,
   }),
 
   new_message: (data: { leadName: string; messagePreview: string; designerName: string }) => ({
     subject: `💬 New Message from ${data.leadName || 'Client'}`,
     html: `
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
           <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
             <tr>
               <td align="center">
                 <table width="600" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
                   <!-- Header -->
                   <tr>
                     <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
                       <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                         💬 New Client Message
                       </h1>
                     </td>
                   </tr>
                   <!-- Content -->
                   <tr>
                     <td style="padding: 32px;">
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                         Hi ${data.designerName},
                       </p>
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                         You have a new message from <strong style="color: #f5f5f5;">${data.leadName || 'a client'}</strong>:
                       </p>
                       <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                         <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                           "${data.messagePreview || 'New message received'}"
                         </p>
                       </div>
                       <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                         Reply Now →
                       </a>
                     </td>
                   </tr>
                   <!-- Footer -->
                   <tr>
                     <td style="background-color: #0a0a0a; padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
                       <p style="margin: 0; color: #525252; font-size: 12px;">
                         Kuester Design Studio • Client Communication
                       </p>
                     </td>
                   </tr>
                 </table>
               </td>
             </tr>
           </table>
         </body>
       </html>
     `,
   }),
 
   proposal_viewed: (data: { leadName: string; proposalId: string; viewedAt: string; designerName: string }) => ({
     subject: `👀 Proposal Viewed by ${data.leadName || 'Client'}`,
     html: `
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
           <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
             <tr>
               <td align="center">
                 <table width="600" cellpadding="0" cellspacing="0" style="background-color: #171717; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">
                   <!-- Header -->
                   <tr>
                     <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 32px; text-align: center;">
                       <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                         👀 Proposal Viewed!
                       </h1>
                     </td>
                   </tr>
                   <!-- Content -->
                   <tr>
                     <td style="padding: 32px;">
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                         Hi ${data.designerName},
                       </p>
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                         Great news! <strong style="color: #f5f5f5;">${data.leadName || 'Your client'}</strong> just viewed your proposal.
                       </p>
                       <div style="background-color: #262626; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                         <p style="color: #a3a3a3; font-size: 13px; margin: 0;">
                           <strong style="color: #8b5cf6;">Viewed at:</strong> ${data.viewedAt}
                         </p>
                       </div>
                       <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                         This is a great time to follow up and answer any questions they might have.
                       </p>
                       <a href="#" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                         View Proposal →
                       </a>
                     </td>
                   </tr>
                   <!-- Footer -->
                   <tr>
                     <td style="background-color: #0a0a0a; padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
                       <p style="margin: 0; color: #525252; font-size: 12px;">
                         Kuester Design Studio • Proposal Tracking
                       </p>
                     </td>
                   </tr>
                 </table>
               </td>
             </tr>
           </table>
         </body>
       </html>
     `,
   }),
 };
 
 async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
   try {
     const res = await fetch("https://api.resend.com/emails", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${RESEND_API_KEY}`,
       },
       body: JSON.stringify({
         from: "Kuester Studio <onboarding@resend.dev>",
         to: [to],
         subject,
         html,
       }),
     });
 
     if (!res.ok) {
       const errorText = await res.text();
       console.error("Resend API error:", errorText);
       return { success: false, error: errorText };
     }
 
     return { success: true };
   } catch (error: any) {
     console.error("Email send error:", error);
     return { success: false, error: error.message };
   }
 }
 
 async function checkNotificationPreference(
   supabase: any,
   teamMemberId: string,
   notificationType: NotificationType
 ): Promise<boolean> {
   const { data: prefs } = await supabase
     .from("notification_preferences")
     .select("*")
     .eq("team_member_id", teamMemberId)
     .single();
 
   if (!prefs) return true; // Default to sending if no preferences set
 
   const prefKey = `${notificationType}_email` as keyof typeof prefs;
   return prefs[prefKey] !== false;
 }
 
 async function logNotification(
   supabase: any,
   data: {
     notification_type: string;
     recipient_email: string;
     recipient_team_member_id?: string;
     lead_id?: string;
     proposal_id?: string;
     status: string;
     error_message?: string;
   }
 ) {
   await supabase.from("notification_log").insert(data);
 }
 
 const handler = async (req: Request): Promise<Response> => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     if (!RESEND_API_KEY) {
       throw new Error("RESEND_API_KEY is not configured");
     }
 
     const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
     const payload: NotificationRequest = await req.json();
 
     console.log("Notification request:", payload);
 
     const { type, lead_id, proposal_id, office_id, assigned_to, message_preview } = payload;
 
     // Fetch office info
     const { data: office } = await supabase
       .from("offices")
       .select("*")
       .eq("id", office_id)
       .single();
 
     // Fetch lead info if provided
     let lead = null;
     if (lead_id) {
       const { data } = await supabase
         .from("leads")
         .select("*")
         .eq("id", lead_id)
         .single();
       lead = data;
     }
 
     // Fetch proposal info if provided
     let proposal = null;
     if (proposal_id) {
       const { data } = await supabase
         .from("proposals")
         .select("*")
         .eq("id", proposal_id)
         .single();
       proposal = data;
     }
 
     const results: { email: string; success: boolean; error?: string }[] = [];
 
     switch (type) {
       case "new_lead": {
         // Notify all active team members in the office
         const { data: teamMembers } = await supabase
           .from("team_members")
           .select("id, display_name, user_id")
           .eq("office_id", office_id)
           .eq("is_active", true);
 
         if (teamMembers) {
           for (const member of teamMembers) {
             // Check preferences
             const shouldSend = await checkNotificationPreference(supabase, member.id, "new_lead");
             if (!shouldSend) continue;
 
             // Get user email from auth
             const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);
             if (!user?.email) continue;
 
             const template = emailTemplates.new_lead({
               leadName: lead?.name || "New Prospect",
               projectType: lead?.project_type || "",
               officeName: office?.name || "Your Studio",
             });
 
             const result = await sendEmail(user.email, template.subject, template.html);
             results.push({ email: user.email, ...result });
 
             await logNotification(supabase, {
               notification_type: "new_lead",
               recipient_email: user.email,
               recipient_team_member_id: member.id,
               lead_id,
               status: result.success ? "sent" : "failed",
               error_message: result.error,
             });
           }
         }
         break;
       }
 
       case "lead_assigned": {
         if (!assigned_to) {
           throw new Error("assigned_to is required for lead_assigned notification");
         }
 
         // Get assigned team member
         const { data: assignee } = await supabase
           .from("team_members")
           .select("id, display_name, user_id")
           .eq("id", assigned_to)
           .single();
 
         if (assignee) {
           const shouldSend = await checkNotificationPreference(supabase, assignee.id, "lead_assigned");
           
           if (shouldSend) {
             const { data: { user } } = await supabase.auth.admin.getUserById(assignee.user_id);
             
             if (user?.email) {
               const template = emailTemplates.lead_assigned({
                 leadName: lead?.name || "New Lead",
                 assigneeName: assignee.display_name,
                 assignerName: "Team Lead",
               });
 
               const result = await sendEmail(user.email, template.subject, template.html);
               results.push({ email: user.email, ...result });
 
               await logNotification(supabase, {
                 notification_type: "lead_assigned",
                 recipient_email: user.email,
                 recipient_team_member_id: assignee.id,
                 lead_id,
                 status: result.success ? "sent" : "failed",
                 error_message: result.error,
               });
             }
           }
         }
         break;
       }
 
       case "new_message": {
         // Notify the assigned designer
         if (lead?.assigned_to) {
           const { data: assignee } = await supabase
             .from("team_members")
             .select("id, display_name, user_id")
             .eq("id", lead.assigned_to)
             .single();
 
           if (assignee) {
             const shouldSend = await checkNotificationPreference(supabase, assignee.id, "new_message");
 
             if (shouldSend) {
               const { data: { user } } = await supabase.auth.admin.getUserById(assignee.user_id);
 
               if (user?.email) {
                 const template = emailTemplates.new_message({
                   leadName: lead?.name || "Client",
                   messagePreview: message_preview || "New message received",
                   designerName: assignee.display_name,
                 });
 
                 const result = await sendEmail(user.email, template.subject, template.html);
                 results.push({ email: user.email, ...result });
 
                 await logNotification(supabase, {
                   notification_type: "new_message",
                   recipient_email: user.email,
                   recipient_team_member_id: assignee.id,
                   lead_id,
                   status: result.success ? "sent" : "failed",
                   error_message: result.error,
                 });
               }
             }
           }
         }
         break;
       }
 
       case "proposal_viewed": {
         // Get the lead's assigned designer
         if (lead?.assigned_to) {
           const { data: assignee } = await supabase
             .from("team_members")
             .select("id, display_name, user_id")
             .eq("id", lead.assigned_to)
             .single();
 
           if (assignee) {
             const shouldSend = await checkNotificationPreference(supabase, assignee.id, "proposal_viewed");
 
             if (shouldSend) {
               const { data: { user } } = await supabase.auth.admin.getUserById(assignee.user_id);
 
               if (user?.email) {
                 const template = emailTemplates.proposal_viewed({
                   leadName: lead?.name || "Client",
                   proposalId: proposal_id || "",
                   viewedAt: new Date().toLocaleString("en-US", {
                     weekday: "long",
                     year: "numeric",
                     month: "long",
                     day: "numeric",
                     hour: "2-digit",
                     minute: "2-digit",
                   }),
                   designerName: assignee.display_name,
                 });
 
                 const result = await sendEmail(user.email, template.subject, template.html);
                 results.push({ email: user.email, ...result });
 
                 await logNotification(supabase, {
                   notification_type: "proposal_viewed",
                   recipient_email: user.email,
                   recipient_team_member_id: assignee.id,
                   lead_id,
                   proposal_id,
                   status: result.success ? "sent" : "failed",
                   error_message: result.error,
                 });
               }
             }
           }
         }
         break;
       }
 
       default:
         throw new Error(`Unknown notification type: ${type}`);
     }
 
     console.log("Notification results:", results);
 
     return new Response(
       JSON.stringify({ success: true, results }),
       {
         status: 200,
         headers: { "Content-Type": "application/json", ...corsHeaders },
       }
     );
   } catch (error: any) {
     console.error("Error in send-notification:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 500,
         headers: { "Content-Type": "application/json", ...corsHeaders },
       }
     );
   }
 };
 
 serve(handler);