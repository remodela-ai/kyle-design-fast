import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { 
      office_id,
      conversation_id,
      conversation_transcript,
      name,
      email,
      phone
    } = await req.json();

    if (!office_id) {
      throw new Error('office_id is required');
    }

    console.log("Processing lead capture for office:", office_id);

    // Extract structured insights from the conversation using Gemini
    interface ExtractedInsights {
      project_type?: string;
      style_preferences?: string[];
      appliance_brands?: string[];
      plumbing_brands?: string[];
      furniture_brands?: string[];
      budget_min?: number;
      budget_max?: number;
      budget_flexibility?: string;
      timeline?: string;
      pain_points?: string[];
      key_requirements?: string[];
      summary?: string;
    }

    let extractedInsights: ExtractedInsights = {};
    let projectType: string | null = null;
    let stylePreferences: string[] = [];
    let applianceBrands: string[] = [];
    let plumbingBrands: string[] = [];
    let furnitureBrands: string[] = [];
    let budgetMin: number | null = null;
    let budgetMax: number | null = null;
    let budgetFlexibility: string | null = null;

    if (conversation_transcript) {
      const extractionPrompt = `Analyze this interior design conversation transcript and extract the following information in JSON format:

{
  "project_type": "kitchen|bathroom|bedroom|living_room|office|other",
  "style_preferences": ["list of mentioned styles like modern, traditional, minimalist, etc."],
  "appliance_brands": ["list of appliance brands mentioned"],
  "plumbing_brands": ["list of plumbing/fixture brands mentioned"],
  "furniture_brands": ["list of furniture brands mentioned"],
  "budget_min": number or null,
  "budget_max": number or null,
  "budget_flexibility": "strict|flexible|open|unknown",
  "timeline": "urgency level or timeframe mentioned",
  "pain_points": ["list of problems with current space"],
  "key_requirements": ["list of must-have features"],
  "summary": "2-3 sentence summary of what the client wants"
}

Transcript:
${conversation_transcript}

Return only valid JSON, no markdown.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are an expert at extracting structured data from conversations. Return only valid JSON." },
              { role: "user", content: extractionPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            try {
              const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '')) as ExtractedInsights;
              extractedInsights = parsed;
              projectType = parsed.project_type || null;
              stylePreferences = parsed.style_preferences || [];
              applianceBrands = parsed.appliance_brands || [];
              plumbingBrands = parsed.plumbing_brands || [];
              furnitureBrands = parsed.furniture_brands || [];
              budgetMin = parsed.budget_min || null;
              budgetMax = parsed.budget_max || null;
              budgetFlexibility = parsed.budget_flexibility || null;
            } catch (parseError) {
              console.error("Error parsing AI response:", parseError);
            }
          }
        }
      } catch (aiError) {
        console.error("Error calling AI for extraction:", aiError);
      }
    }

    // Create the lead record
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        office_id,
        conversation_id,
        conversation_transcript,
        extracted_insights: extractedInsights,
        name: name || null,
        email: email || null,
        phone: phone || null,
        project_type: projectType,
        style_preferences: stylePreferences,
        appliance_brands: applianceBrands,
        plumbing_brands: plumbingBrands,
        furniture_brands: furnitureBrands,
        budget_min: budgetMin,
        budget_max: budgetMax,
        budget_flexibility: budgetFlexibility,
        status: 'new',
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }

    console.log("Lead created successfully:", lead.id);

    return new Response(JSON.stringify({
      success: true,
      lead_id: lead.id,
      extracted_insights: extractedInsights,
      message: "Lead captured successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in lead capture:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
