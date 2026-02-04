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

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not configured');
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

    // Create the lead record first
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

    // Generate Flux 2 Pro design rendering if we have enough insights
    let preliminaryDesignUrl: string | null = null;

    if (extractedInsights.summary || projectType) {
      try {
        // Build a rich design prompt from extracted insights
        const designPromptParts: string[] = [];
        
        // Project type
        const roomType = projectType || 'interior space';
        designPromptParts.push(`Professional interior design rendering of a ${roomType}`);
        
        // Style preferences
        if (stylePreferences.length > 0) {
          designPromptParts.push(`in ${stylePreferences.join(' and ')} style`);
        }
        
        // Brand mentions for context
        const allBrands = [...applianceBrands, ...plumbingBrands, ...furnitureBrands];
        if (allBrands.length > 0) {
          designPromptParts.push(`featuring high-end fixtures and ${allBrands.slice(0, 3).join(', ')} inspired elements`);
        }
        
        // Key requirements
        if (extractedInsights.key_requirements && extractedInsights.key_requirements.length > 0) {
          designPromptParts.push(`with ${extractedInsights.key_requirements.slice(0, 3).join(', ')}`);
        }
        
        // Summary context
        if (extractedInsights.summary) {
          designPromptParts.push(`- ${extractedInsights.summary}`);
        }
        
        // Quality modifiers
        designPromptParts.push('Photorealistic, architectural visualization, natural lighting, 8K quality, professional photography');
        
        const fluxPrompt = designPromptParts.join('. ');
        console.log("Generated Flux prompt:", fluxPrompt);

        // Call Replicate Flux 2 Pro API
        const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
            input: {
              prompt: fluxPrompt,
              num_outputs: 1,
              aspect_ratio: "16:9",
              output_format: "webp",
              output_quality: 90,
              num_inference_steps: 28,
              guidance: 3,
            },
          }),
        });

        if (!replicateResponse.ok) {
          const errorText = await replicateResponse.text();
          console.error("Replicate API error:", replicateResponse.status, errorText);
          throw new Error(`Replicate API error: ${replicateResponse.status}`);
        }

        const prediction = await replicateResponse.json();
        console.log("Replicate prediction created:", prediction.id);

        // Poll for completion
        let imageUrl: string | null = null;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: {
              "Authorization": `Bearer ${REPLICATE_API_KEY}`,
            },
          });

          if (!statusResponse.ok) {
            console.error("Error checking prediction status");
            break;
          }

          const statusData = await statusResponse.json();
          console.log("Prediction status:", statusData.status);

          if (statusData.status === "succeeded" && statusData.output) {
            imageUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            break;
          } else if (statusData.status === "failed") {
            console.error("Prediction failed:", statusData.error);
            break;
          }

          attempts++;
        }

        if (imageUrl) {
          console.log("Flux image generated:", imageUrl);

          // Download the image
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const imageBuffer = await imageBlob.arrayBuffer();
            
            // Upload to Supabase storage
            const fileName = `lead-${lead.id}-${Date.now()}.webp`;
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('lead-assets')
              .upload(fileName, imageBuffer, {
                contentType: 'image/webp',
                upsert: true,
              });

            if (uploadError) {
              console.error("Error uploading to storage:", uploadError);
            } else {
              // Get public URL
              const { data: publicUrlData } = supabase
                .storage
                .from('lead-assets')
                .getPublicUrl(fileName);

              preliminaryDesignUrl = publicUrlData.publicUrl;
              console.log("Image uploaded to storage:", preliminaryDesignUrl);

              // Update lead with the design URL
              const { error: updateError } = await supabase
                .from('leads')
                .update({ preliminary_design_url: preliminaryDesignUrl })
                .eq('id', lead.id);

              if (updateError) {
                console.error("Error updating lead with design URL:", updateError);
              }
            }
          }
        }
      } catch (fluxError) {
        console.error("Error generating Flux design:", fluxError);
        // Continue without the design - it's not critical
      }
    }

    return new Response(JSON.stringify({
      success: true,
      lead_id: lead.id,
      extracted_insights: extractedInsights,
      preliminary_design_url: preliminaryDesignUrl,
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
