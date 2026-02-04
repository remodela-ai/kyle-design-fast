import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedQuery {
  category: string | null;
  style: string | null;
  price_min: number | null;
  price_max: number | null;
  brand_preference: string | null;
  material: string | null;
  keywords: string[];
}

interface ProductRecommendation {
  vendor_id: string;
  vendor_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  category: string | null;
  estimated_price_range: {
    min: number;
    max: number;
    currency: string;
  };
  style_match_score: number;
  match_reasons: string[];
  availability_notes: string;
  discount_terms: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, office_id } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!office_id) {
      return new Response(
        JSON.stringify({ error: "office_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("[kyle-product-search] Processing query:", query);

    // Step 1: Parse the natural language query with Gemini
    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a product search query parser for interior design. Extract structured information from natural language product queries.

Parse the query and return a JSON object with these fields:
- category: The product category (e.g., "lighting", "furniture", "flooring", "plumbing", "appliances", "textiles", "hardware", "paint", "tile", "countertops")
- style: The design style if mentioned (e.g., "modern", "traditional", "minimalist", "industrial", "mid-century", "scandinavian", "bohemian", "coastal")
- price_min: Minimum price if mentioned (number only, no currency)
- price_max: Maximum price if mentioned (number only, no currency)
- brand_preference: Any specific brand mentioned
- material: Any material preference (e.g., "brass", "marble", "oak", "ceramic", "stainless steel")
- keywords: Array of other relevant keywords for searching

Return ONLY valid JSON, no markdown or explanation.`
          },
          {
            role: "user",
            content: query
          }
        ],
      }),
    });

    if (!parseResponse.ok) {
      console.error("[kyle-product-search] Parse error:", await parseResponse.text());
      throw new Error("Failed to parse query");
    }

    const parseData = await parseResponse.json();
    const parseContent = parseData.choices?.[0]?.message?.content || "{}";
    
    let parsedQuery: ParsedQuery;
    try {
      const jsonMatch = parseContent.match(/\{[\s\S]*\}/);
      parsedQuery = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error("[kyle-product-search] JSON parse error:", e);
      parsedQuery = {
        category: null,
        style: null,
        price_min: null,
        price_max: null,
        brand_preference: null,
        material: null,
        keywords: []
      };
    }

    console.log("[kyle-product-search] Parsed query:", parsedQuery);

    // Step 2: Search material_vendors table
    let vendorQuery = supabase
      .from("material_vendors")
      .select("*")
      .eq("office_id", office_id);

    // Apply category filter if available
    if (parsedQuery.category) {
      vendorQuery = vendorQuery.ilike("category", `%${parsedQuery.category}%`);
    }

    const { data: vendors, error: vendorError } = await vendorQuery;

    if (vendorError) {
      console.error("[kyle-product-search] Vendor search error:", vendorError);
      throw new Error("Failed to search vendors");
    }

    console.log("[kyle-product-search] Found vendors:", vendors?.length || 0);

    // Step 3: Generate recommendations with AI scoring
    const recommendations: ProductRecommendation[] = [];

    if (vendors && vendors.length > 0) {
      // Use Gemini to score and enhance vendor matches
      const scoringResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an interior design product sourcing expert. Given a search query and a list of vendors, score each vendor's relevance and provide product recommendations.

For each vendor, provide:
- style_match_score: 0-100 based on how well they match the query
- match_reasons: Array of reasons why they're a good match
- estimated_price_range: { min, max } estimated price for the searched product type
- availability_notes: Brief note about typical availability

Return a JSON array with vendor_id and these fields. Only include vendors with score > 30.
Return ONLY valid JSON array, no markdown.`
            },
            {
              role: "user",
              content: `Search Query: "${query}"
Parsed Query: ${JSON.stringify(parsedQuery)}

Vendors:
${vendors.map(v => `- ID: ${v.id}, Name: ${v.name}, Category: ${v.category || 'General'}, Notes: ${v.notes || 'None'}`).join('\n')}`
            }
          ],
        }),
      });

      if (scoringResponse.ok) {
        const scoringData = await scoringResponse.json();
        const scoringContent = scoringData.choices?.[0]?.message?.content || "[]";
        
        try {
          const jsonMatch = scoringContent.match(/\[[\s\S]*\]/);
          const scores = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
          
          for (const score of scores) {
            const vendor = vendors.find(v => v.id === score.vendor_id);
            if (vendor && score.style_match_score > 30) {
              recommendations.push({
                vendor_id: vendor.id,
                vendor_name: vendor.name,
                contact_name: vendor.contact_name,
                email: vendor.email,
                phone: vendor.phone,
                website: vendor.website,
                category: vendor.category,
                estimated_price_range: score.estimated_price_range || {
                  min: parsedQuery.price_min || 100,
                  max: parsedQuery.price_max || 1000,
                  currency: "USD"
                },
                style_match_score: score.style_match_score,
                match_reasons: score.match_reasons || ["Category match"],
                availability_notes: score.availability_notes || "Contact vendor for current availability",
                discount_terms: vendor.discount_terms,
              });
            }
          }
        } catch (e) {
          console.error("[kyle-product-search] Scoring parse error:", e);
          // Fallback: include all vendors with basic info
          for (const vendor of vendors) {
            recommendations.push({
              vendor_id: vendor.id,
              vendor_name: vendor.name,
              contact_name: vendor.contact_name,
              email: vendor.email,
              phone: vendor.phone,
              website: vendor.website,
              category: vendor.category,
              estimated_price_range: {
                min: parsedQuery.price_min || 100,
                max: parsedQuery.price_max || 1000,
                currency: "USD"
              },
              style_match_score: 50,
              match_reasons: ["Category match"],
              availability_notes: "Contact vendor for availability",
              discount_terms: vendor.discount_terms,
            });
          }
        }
      }
    }

    // Sort by match score
    recommendations.sort((a, b) => b.style_match_score - a.style_match_score);

    // Step 4: Generate search summary
    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `Generate a brief 1-2 sentence summary of the search results for: "${query}"
Found ${recommendations.length} matching vendors.
Top categories: ${[...new Set(recommendations.map(r => r.category).filter(Boolean))].join(', ') || 'Various'}

Be helpful and professional.`
          }
        ],
      }),
    });

    let searchSummary = `Found ${recommendations.length} vendors matching your search.`;
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      searchSummary = summaryData.choices?.[0]?.message?.content || searchSummary;
    }

    console.log("[kyle-product-search] Returning", recommendations.length, "recommendations");

    return new Response(
      JSON.stringify({
        success: true,
        query: query,
        parsed_query: parsedQuery,
        summary: searchSummary,
        recommendations: recommendations,
        total_results: recommendations.length,
        future_integrations: [
          "Wayfair API integration coming soon",
          "Build.com catalog integration planned",
          "1stDibs for luxury items",
          "Local supplier networks"
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[kyle-product-search] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
