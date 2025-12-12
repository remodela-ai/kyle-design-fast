import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orielNotes, jamesNotes, knowledgeBase } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating GTM synthesis...");
    console.log("Oriel notes length:", orielNotes?.length || 0);
    console.log("James notes length:", jamesNotes?.length || 0);

    const systemPrompt = `You are Kyle Comm, a GTM strategist and Agile standup facilitator for Next Interiors.
Your job is to synthesize insights from both co-founders (Oriel and James) and create a clear, actionable GTM daily plan.

Output format MUST be in English and follow this EXACT structure:

## 🎯 Today's GTM Synthesis

### Oriel's Key Points
[Bullet points summarizing Oriel's main ideas, priorities, and concerns]

### James's Key Points  
[Bullet points summarizing James's main ideas, priorities, and concerns]

### ✅ Alignment Points
[Areas where Oriel and James are already aligned - what they agree on]

### ⚠️ Points to Discuss
[Areas of potential misalignment or items that need further discussion between them]

### 📋 Today's Action Items
[Specific, actionable tasks for today based on the sync]

### 🎯 Tomorrow's Objectives
[Key objectives to focus on for the next day]

Be concise but comprehensive. Focus on actionable insights.`;

    const userPrompt = `Synthesize this daily GTM standup:

**ORIEL'S SESSION:**
${orielNotes || "No notes captured from Oriel's session"}

**JAMES'S SESSION:**
${jamesNotes || "No notes captured from James's session"}

${knowledgeBase ? `**KNOWLEDGE BASE CONTEXT:**\n${knowledgeBase.substring(0, 2000)}` : ''}

Generate the GTM synthesis following the exact format specified.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const synthesis = data.choices?.[0]?.message?.content || "Unable to generate synthesis";

    console.log("Synthesis generated successfully");

    return new Response(JSON.stringify({ synthesis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in gtm-synthesis:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
