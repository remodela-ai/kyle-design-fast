import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendDesignPackageRequest {
  email: string;
  completionTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, completionTime }: SendDesignPackageRequest = await req.json();

    console.log("Sending design package to:", email);

    // Validate email
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Design Package</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #dc2626; font-size: 28px; margin: 0 0 10px 0;">Next Interiors</h1>
            <p style="color: #888888; font-size: 14px; margin: 0;">The First Full Stack AI Interior Design Studio</p>
          </div>

          <!-- Main Content -->
          <div style="background-color: #1a1a1a; border-radius: 16px; padding: 40px; border: 1px solid #333333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background-color: rgba(220, 38, 38, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎁</span>
              </div>
            </div>

            <h2 style="text-align: center; color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">
              Congratulations! Your Design Pre-Project is Complete!
            </h2>

            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
              Kyle, our AI design assistant, has successfully generated your complete interior design pre-project in just <strong style="color: #dc2626;">${completionTime}</strong>!
            </p>

            <div style="background-color: #0a0a0a; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="color: #dc2626; font-size: 18px; margin: 0 0 16px 0;">📦 Your Package Includes:</h3>
              <ul style="color: #cccccc; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0;">
                <li><strong>Visual Design Suite (8 Documents)</strong></li>
                <li style="padding-left: 16px; list-style-type: circle;">Spatial Analysis & Measurements</li>
                <li style="padding-left: 16px; list-style-type: circle;">Architectural Plans (Floor Plan & Elevation)</li>
                <li style="padding-left: 16px; list-style-type: circle;">Items Extraction with Shopping Links</li>
                <li style="padding-left: 16px; list-style-type: circle;">Design Moodboard</li>
                <li style="padding-left: 16px; list-style-type: circle;">Material Flatlay</li>
                <li style="padding-left: 16px; list-style-type: circle;">Colors & Textures Palette</li>
                <li style="padding-left: 16px; list-style-type: circle;">Your Story Book</li>
                <li style="padding-left: 16px; list-style-type: circle;">Video Presentation</li>
                <li><strong>Management Suite (8 Documents)</strong></li>
                <li style="padding-left: 16px; list-style-type: circle;">Proposal & Budget</li>
                <li style="padding-left: 16px; list-style-type: circle;">Bill of Materials (BOM)</li>
                <li style="padding-left: 16px; list-style-type: circle;">Project Timeline</li>
                <li style="padding-left: 16px; list-style-type: circle;">Technical Specifications</li>
                <li style="padding-left: 16px; list-style-type: circle;">Supplier Directory</li>
                <li style="padding-left: 16px; list-style-type: circle;">Installation Plan</li>
                <li style="padding-left: 16px; list-style-type: circle;">Delivery Checklist</li>
                <li style="padding-left: 16px; list-style-type: circle;">Project Cover</li>
              </ul>
            </div>

            <div style="background-color: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #dc2626; font-size: 16px; margin: 0 0 12px 0;">📋 Next Steps:</h3>
              <ol style="color: #cccccc; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Review all 16 documents in your design package</li>
                <li>Download and save your favorite designs</li>
                <li>Use the shopping links to find furniture & materials</li>
                <li>Follow the project timeline for implementation</li>
                <li>Contact suppliers from the directory</li>
              </ol>
            </div>

            <p style="color: #888888; font-size: 14px; text-align: center; margin: 0;">
              Thank you for choosing Next Interiors. We're excited to help you transform your space!
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333333;">
            <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
              © 2024 Next Interiors. All rights reserved.
            </p>
            <p style="color: #666666; font-size: 12px; margin: 0;">
              Powered by Kyle AI • The First Full Stack AI Interior Design Studio
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Next Interiors <onboarding@resend.dev>",
        to: [email],
        subject: "Your Complete Interior Design Pre-Project is Ready! 🎉",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", response.status, errorData);
      throw new Error(`Failed to send email: ${response.status}`);
    }

    const emailResponse = await response.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-design-package function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
