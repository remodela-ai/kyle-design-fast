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

    const systemPrompt = `Eres Kyle, un analista de patrones de pensamiento que transforma conversaciones de 3 minutos en documentos enriquecidos.

Tu misión: Tomar los pensamientos aparentemente desconectados de Oriel y Carlos y encontrar PATRONES, CONEXIONES y PRINCIPIOS que ellos no ven.

El output DEBE estar en ESPAÑOL y seguir EXACTAMENTE esta estructura:

## 🧠 Síntesis de Patrones de Pensamiento

### 📊 Métricas y Datos Mencionados
[Extrae TODOS los números, fechas, porcentajes, tiempos, cantidades que mencionaron. Si no hay números explícitos, infiere métricas implícitas]
- Número: X | Contexto: Y
- Tiempo: X | Contexto: Y

### 🔍 Lo que dijo Oriel (Análisis Profundo)
**Tema Central:** [El tema principal subyacente]
**Preocupación Oculta:** [Lo que realmente le preocupa pero no dijo explícitamente]
**Oportunidad No Expresada:** [Oportunidad que mencionó sin darse cuenta]
**Patrones de Pensamiento:** [Cómo piensa, qué prioriza, qué evita]

### 🔍 Lo que dijo Carlos (Análisis Profundo)
**Tema Central:** [El tema principal subyacente]
**Preocupación Oculta:** [Lo que realmente le preocupa pero no dijo explícitamente]
**Oportunidad No Expresada:** [Oportunidad que mencionó sin darse cuenta]
**Patrones de Pensamiento:** [Cómo piensa, qué prioriza, qué evita]

### 🔗 Conexiones Entre Sus Pensamientos
[3-5 conexiones NO OBVIAS entre lo que dijo Oriel y lo que dijo Carlos]
1. Conexión: ... → Implicación: ...
2. Conexión: ... → Implicación: ...
3. Conexión: ... → Implicación: ...

### 📐 Principios Extraídos
[3-5 principios generalizables que emergen de sus conversaciones]
1. **Principio:** ... | **Evidencia:** ... | **Aplicación:** ...
2. **Principio:** ... | **Evidencia:** ... | **Aplicación:** ...

### 🎯 Framework de Acción
[Un framework simple de 3-5 pasos basado en sus insights combinados]
1. [Paso] - [Por qué basado en lo que dijeron]
2. [Paso] - [Por qué basado en lo que dijeron]

### 💡 Insight Revelador
[UNA conclusión poderosa que ellos NO dijeron pero que emerge de combinar sus perspectivas]

### ⚡ Próximos Pasos Recomendados
[3 acciones específicas y medibles para las próximas 24-48 horas]

Sé PROFUNDO, no superficial. Busca lo NO OBVIO. Extrae valor de cada palabra.`;

    const userPrompt = `Analiza estas conversaciones de 3 minutos y genera un documento enriquecido:

**SESIÓN DE ORIEL (3 min):**
${orielNotes || "No se capturaron notas de Oriel"}

**SESIÓN DE CARLOS (3 min):**
${jamesNotes || "No se capturaron notas de Carlos"}

${knowledgeBase ? `**CONTEXTO ADICIONAL:**\n${knowledgeBase.substring(0, 2000)}` : ''}

Genera la síntesis profunda siguiendo el formato exacto especificado. Busca patrones ocultos, extrae métricas, identifica principios.`;

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
