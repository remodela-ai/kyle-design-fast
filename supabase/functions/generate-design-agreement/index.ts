import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeeBreakdown {
  base_fee: number;
  adjustments: { name: string; amount: number; description: string }[];
  total_fee: number;
  payment_schedule: { name: string; percentage: number; amount: number }[];
  breakdown: {
    project_type: string;
    square_footage: number;
    complexity_multiplier: number;
  };
}

interface RequestBody {
  lead_id: string;
  fee_breakdown: FeeBreakdown;
  custom_terms?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const body: RequestBody = await req.json();
    const { lead_id, fee_breakdown, custom_terms } = body;

    if (!lead_id || !fee_breakdown) {
      throw new Error('lead_id and fee_breakdown are required');
    }

    console.log('Generating design agreement for lead:', lead_id);

    // Fetch lead data with office info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, offices(*)')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    const office = lead.offices;
    const insights = lead.extracted_insights || {};
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build the prompt for Gemini
    const prompt = `Generate a professional interior design agreement contract. Use the following information:

CLIENT INFORMATION:
- Name: ${lead.name || 'Client Name'}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}

DESIGNER INFORMATION:
- Company: ${office?.name || 'Design Studio'}
- Location: ${office?.location || 'Not specified'}
- Email: ${office?.email || 'Not provided'}
- Phone: ${office?.phone || 'Not provided'}

PROJECT DETAILS:
- Project Type: ${lead.project_type || 'Interior Design'}
- Room Size: ${fee_breakdown.breakdown?.square_footage || 'TBD'} square feet
- Style Preferences: ${lead.style_preferences?.join(', ') || 'To be determined'}
- Appliance Brands: ${lead.appliance_brands?.join(', ') || 'None specified'}
- Plumbing Brands: ${lead.plumbing_brands?.join(', ') || 'None specified'}
- Furniture Brands: ${lead.furniture_brands?.join(', ') || 'None specified'}

EXTRACTED INSIGHTS:
${JSON.stringify(insights, null, 2)}

FEE STRUCTURE:
- Base Design Fee: $${fee_breakdown.base_fee.toLocaleString()}
${fee_breakdown.adjustments.map(a => `- ${a.name}: +$${a.amount.toLocaleString()} (${a.description})`).join('\n')}
- Total Fee: $${fee_breakdown.total_fee.toLocaleString()}

PAYMENT SCHEDULE:
${fee_breakdown.payment_schedule.map(p => `- ${p.name} (${p.percentage}%): $${p.amount.toLocaleString()}`).join('\n')}

${custom_terms ? `ADDITIONAL TERMS REQUESTED:\n${custom_terms}` : ''}

Generate a complete, legally-sound design agreement that includes:

1. AGREEMENT HEADER with date (${currentDate}) and parties involved
2. SCOPE OF WORK - detailed description based on project type and insights
3. DESIGN FEE AND PAYMENT TERMS - exact amounts from fee structure
4. PROJECT TIMELINE - realistic phases for this type of project
5. REVISION POLICY - two complimentary rounds, additional at hourly rate
6. INTELLECTUAL PROPERTY CLAUSE - ownership transfers upon final payment
7. CANCELLATION TERMS - deposit non-refundable, work completed to date billable
8. CLIENT RESPONSIBILITIES - timely feedback, access, decisions
9. DESIGNER RESPONSIBILITIES - professional standards, communication
10. LIMITATION OF LIABILITY - standard professional liability limits
11. CONFIDENTIALITY - both parties maintain project confidentiality
12. GOVERNING LAW - State jurisdiction based on designer location
13. SIGNATURE BLOCKS - spaces for both parties with date lines

Format the response as valid HTML with proper semantic elements, professional styling inline, and clear section headers. Use a clean, modern design with proper spacing and typography. Make it look like a professional legal document.`;

    // Call Gemini via Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional legal document writer specializing in interior design contracts. Generate complete, professional agreements in valid HTML format. Be thorough but concise. Include all necessary legal protections for both parties.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('Failed to generate agreement');
    }

    const aiData = await aiResponse.json();
    const agreementHtml = aiData.choices?.[0]?.message?.content || '';

    // Extract plain text from HTML (simple approach)
    const agreementText = agreementHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const generatedAt = new Date().toISOString();

    // Store in proposals table
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        lead_id,
        office_id: lead.office_id,
        total_fee: fee_breakdown.total_fee,
        fee_breakdown: fee_breakdown,
        agreement_html: agreementHtml,
        agreement_text: agreementText,
        custom_terms: custom_terms || null,
        status: 'draft',
        generated_at: generatedAt,
      })
      .select()
      .single();

    if (proposalError) {
      console.error('Failed to save proposal:', proposalError);
      // Continue anyway - return the generated agreement
    }

    console.log('Agreement generated successfully, proposal ID:', proposal?.id);

    return new Response(JSON.stringify({
      agreement_html: agreementHtml,
      agreement_text: agreementText,
      generated_at: generatedAt,
      proposal_id: proposal?.id || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating design agreement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
