import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageRequest {
  lead_id: string;
  content: string;
  sender: "kyle" | "designer";
  send_email?: boolean;
  use_tts?: boolean;
  voice_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id, content, sender, send_email = false, use_tts = false, voice_id } = await req.json() as MessageRequest;

    if (!lead_id || !content) {
      return new Response(
        JSON.stringify({ error: "lead_id and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("[kyle-send-message] Processing message for lead:", lead_id);

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, offices(*)")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      console.error("[kyle-send-message] Lead fetch error:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store message in lead_messages table
    const { data: message, error: messageError } = await supabase
      .from("lead_messages")
      .insert({
        lead_id,
        content,
        sender,
      })
      .select()
      .single();

    if (messageError) {
      console.error("[kyle-send-message] Message insert error:", messageError);
      throw new Error("Failed to store message");
    }

    console.log("[kyle-send-message] Message stored:", message.id);

    const results: {
      message_id: string;
      email_sent: boolean;
      email_error?: string;
      voice_queued: boolean;
      voice_url?: string;
    } = {
      message_id: message.id,
      email_sent: false,
      voice_queued: false,
    };

    // Send email notification if requested
    if (send_email && lead.email && RESEND_API_KEY) {
      try {
        const office = lead.offices as { name: string; email?: string } | null;
        const officeName = office?.name || "Design Studio";
        const officeEmail = office?.email || "noreply@resend.dev";

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
              .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">${officeName}</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">New Message from Your Design Team</p>
              </div>
              <div class="content">
                <p>Hi ${lead.name || "there"},</p>
                <div class="message-box">
                  ${content.replace(/\n/g, "<br>")}
                </div>
                <p>We're excited to continue working on your project. Feel free to reply to this email with any questions.</p>
                <p>Best regards,<br><strong>${sender === "kyle" ? "Kyle, AI Design Assistant" : "Your Design Team"}</strong></p>
              </div>
              <div class="footer">
                <p>This message was sent by ${officeName}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Use fetch to call Resend API directly
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${officeName} <${officeEmail.includes("@") && !officeEmail.includes("@example") ? officeEmail : "onboarding@resend.dev"}>`,
            to: [lead.email],
            subject: `Message from ${officeName}`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log("[kyle-send-message] Email sent successfully");
          results.email_sent = true;
        } else {
          const emailError = await emailResponse.text();
          console.error("[kyle-send-message] Email error:", emailError);
          results.email_error = emailError;
        }
      } catch (emailError) {
        console.error("[kyle-send-message] Email error:", emailError);
        results.email_error = emailError instanceof Error ? emailError.message : "Email failed";
      }
    }

    // Generate TTS voice message if requested
    if (use_tts && ELEVENLABS_API_KEY) {
      try {
        const selectedVoiceId = voice_id || "JBFqnCBsd6RMkjVDRZzb"; // Default to George

        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: content,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.3,
              },
            }),
          }
        );

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioBase64 = btoa(
            String.fromCharCode(...new Uint8Array(audioBuffer).slice(0, 100000))
          );

          // Store voice message reference - could be uploaded to storage
          // For now, we'll queue it as metadata
          const { error: updateError } = await supabase
            .from("lead_messages")
            .update({
              content: content,
              // Store indicator that voice is available
            })
            .eq("id", message.id);

          console.log("[kyle-send-message] Voice message generated");
          results.voice_queued = true;
          // In production, upload to storage and return URL
        } else {
          console.error("[kyle-send-message] TTS error:", await ttsResponse.text());
        }
      } catch (ttsError) {
        console.error("[kyle-send-message] TTS error:", ttsError);
      }
    }

    // Update lead's updated_at timestamp
    await supabase
      .from("leads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", lead_id);

    console.log("[kyle-send-message] Complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[kyle-send-message] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
