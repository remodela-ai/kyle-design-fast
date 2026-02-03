import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GTMSynthesisEmailRequest {
  synthesis: string;
  orielNotes: string;
  jamesNotes: string;
  syncDate: string;
  recipients?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { synthesis, orielNotes, jamesNotes, syncDate, recipients }: GTMSynthesisEmailRequest = await req.json();

    // Validate and sanitize recipients
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const defaultRecipient = "oriel@copilotinnovations.com";
    const validRecipients = recipients && recipients.length > 0
      ? recipients.filter(email => emailRegex.test(email.trim())).map(e => e.trim().toLowerCase())
      : [defaultRecipient];

    console.log("Sending GTM synthesis email to:", validRecipients);

    const formattedDate = new Date(syncDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily GTM Sync - ${formattedDate}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #262626; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(220, 38, 38, 0.15);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        🎯 Daily GTM Sync Complete
                      </h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                        ${formattedDate}
                      </p>
                    </td>
                  </tr>

                  <!-- GTM Synthesis Section -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #dc2626; font-size: 20px; font-weight: 600; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">
                        📋 GTM Synthesis
                      </h2>
                      <div style="color: #e5e5e5; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
                        ${synthesis.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding: 0 32px;">
                      <hr style="border: none; border-top: 1px solid #404040; margin: 0;">
                    </td>
                  </tr>

                  <!-- Oriel's Notes -->
                  <tr>
                    <td style="padding: 24px 32px;">
                      <h3 style="margin: 0 0 12px 0; color: #a3a3a3; font-size: 16px; font-weight: 600;">
                        🇪🇸 Oriel's Notes
                      </h3>
                      <div style="background-color: #333333; border-radius: 8px; padding: 16px; color: #d4d4d4; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                        ${orielNotes ? orielNotes.replace(/\n/g, '<br>') : 'No notes recorded'}
                      </div>
                    </td>
                  </tr>

                  <!-- James's Notes -->
                  <tr>
                    <td style="padding: 0 32px 24px 32px;">
                      <h3 style="margin: 0 0 12px 0; color: #a3a3a3; font-size: 16px; font-weight: 600;">
                        🇺🇸 James's Notes
                      </h3>
                      <div style="background-color: #333333; border-radius: 8px; padding: 16px; color: #d4d4d4; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                        ${jamesNotes ? jamesNotes.replace(/\n/g, '<br>') : 'No notes recorded'}
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f1f1f; padding: 24px 32px; text-align: center;">
                      <p style="margin: 0; color: #737373; font-size: 13px;">
                        James Kuester • Full Stack AI Interior Design Studio
                      </p>
                      <p style="margin: 8px 0 0 0; color: #525252; font-size: 12px;">
                        This email was automatically generated after your daily GTM sync.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "James Kuester <onboarding@resend.dev>",
        to: validRecipients,
        subject: `🎯 Daily GTM Sync Complete - ${formattedDate}`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${res.status}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending GTM synthesis email:", error);
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
