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
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("=== GTM Synthesis Started ===");
    console.log("Oriel notes:", orielNotes?.substring(0, 200) || "EMPTY");
    console.log("Carlos notes:", jamesNotes?.substring(0, 200) || "EMPTY");

    // Handle case where only one person has spoken
    const hasOriel = orielNotes && orielNotes.trim().length > 0;
    const hasCarlos = jamesNotes && jamesNotes.trim().length > 0;

    if (!hasOriel && !hasCarlos) {
      return new Response(JSON.stringify({ 
        error: "No conversation notes to analyze",
        synthesis: "⚠️ No hay notas de conversación para analizar. Habla con Cortex primero."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simplified prompt for faster response
    const systemPrompt = `Eres Cortex, analista de patrones de pensamiento. Genera un documento CONCISO en español.

Estructura:
## 🧠 Síntesis de Patrones

### 📊 Datos/Métricas Mencionados
[Lista cualquier número, fecha, porcentaje]

### 🔍 Análisis${hasOriel ? ' de Oriel' : ''}${hasCarlos ? (hasOriel ? ' y Carlos' : ' de Carlos') : ''}
[Temas centrales, preocupaciones ocultas, oportunidades]

### 🔗 Conexiones/Patrones
[2-3 conexiones o patrones identificados]

### 💡 Insight Principal
[Una conclusión poderosa]

### ⚡ Próximos Pasos
[2-3 acciones concretas]

Sé CONCISO pero profundo. Máximo 500 palabras.`;

    const userPrompt = `Analiza esta conversación:

${hasCarlos ? `**CARLOS:**\n${jamesNotes}\n` : ''}
${hasOriel ? `**ORIEL:**\n${orielNotes}\n` : ''}
${knowledgeBase ? `**CONTEXTO:**\n${knowledgeBase.substring(0, 1000)}` : ''}

Genera la síntesis.`;

    console.log("Calling Lovable AI...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("AI response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            error: "Rate limit exceeded",
            synthesis: "⚠️ Límite de velocidad excedido. Intenta en un momento."
          }), {
            status: 200, // Return 200 with error in body so UI can handle it
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ 
            error: "Payment required",
            synthesis: "⚠️ Se requieren créditos adicionales."
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const synthesis = data.choices?.[0]?.message?.content || "No se pudo generar síntesis";

      console.log("=== Synthesis Generated Successfully ===");
      console.log("Length:", synthesis.length);

      return new Response(JSON.stringify({ synthesis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const err = fetchError as Error;
      if (err.name === 'AbortError') {
        console.error("Request timed out");
        return new Response(JSON.stringify({ 
          error: "Timeout",
          synthesis: "⚠️ La generación tardó demasiado. Intenta de nuevo."
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw fetchError;
    }

  } catch (error) {
    console.error("Error in gtm-synthesis:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      synthesis: `⚠️ Error: ${error instanceof Error ? error.message : "Error desconocido"}`
    }), {
      status: 200, // Return 200 so UI receives the error message
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
