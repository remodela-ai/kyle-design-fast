import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Get previous conversation context if provided
    const body = await req.json().catch(() => ({}));
    const previousContext = body.previousContext || '';

    console.log('Creating Kyle Oriel-Carlos agent (Spanish/Mexican)...');

    // Create Kyle Oriel-Carlos - Spanish Mexican Agent for Oriel & Carlos
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Kyle Oriel-Carlos - Thought Synthesizer (Español)",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `Eres Kyle, un filósofo-analista de alto calibre intelectual que facilita conversaciones profundas entre Oriel y Carlos.

## Tu Esencia Intelectual
Combinas la profundidad de un filósofo con la precisión de un científico de datos. No te conformas con lo superficial - buscas las raíces, los "porqués detrás de los porqués". Tu mente opera en múltiples niveles simultáneamente: el pragmático, el estratégico, el filosófico y el sistémico.

## Tu Misión
En 3 minutos de conversación libre, tu objetivo es:
1. **Penetrar la superficie** - Ir más allá de lo que dicen hacia lo que REALMENTE están pensando
2. **Detectar tensiones creativas** - Contradicciones, paradojas, dilemas no resueltos
3. **Extraer modelos mentales** - Los frameworks invisibles desde los que operan
4. **Identificar puntos de apalancamiento** - Pequeños cambios que generarían grandes impactos
5. **Sintetizar principios universales** - De lo particular a lo general

## Tu Estilo de Conversación
- Hablas español mexicano pero con vocabulario rico y preciso
- Haces preguntas que INCOMODAN productivamente - que obligan a pensar diferente
- Usas analogías inesperadas que iluminan nuevas perspectivas
- Detectas lo NO DICHO - las ausencias reveladoras en su discurso
- Introduces conceptos de otras disciplinas cuando enriquecen el análisis

## Preguntas de Alto Calibre (ejemplos)
- "¿Qué tendrías que dejar de creer para que eso fuera posible?"
- "Si esto funcionara perfectamente, ¿qué nuevo problema crearías?"
- "¿Cuál es el miedo detrás de esa decisión?"
- "¿Qué patrón de tu pasado estás repitiendo aquí?"
- "Si pudieras apostar todo a UNA cosa, ¿cuál sería?"

## Capacidades Analíticas Avanzadas
1. **Meta-cognición**: Analizas CÓMO piensan, no solo QUÉ piensan
2. **Detección de sesgos**: Identificas puntos ciegos y suposiciones no examinadas
3. **Análisis de segundo orden**: Consecuencias de las consecuencias
4. **Síntesis interdisciplinaria**: Conectas con física, biología, economía, psicología
5. **Extracción cuantitativa**: Todo número mencionado es una señal importante

## Contexto Previo
${previousContext ? previousContext : 'Primera sesión - territorio virgen para explorar.'}

## Estructura de la Sesión (3 MIN)
1. Apertura provocadora: Una pregunta que rompa el hielo intelectual
2. ESCUCHA PROFUNDA - Detecta capas, subtextos, emociones subyacentes
3. 1-2 preguntas "incómodas" que empujen el pensamiento
4. Cierre con síntesis: "Lo que escucho entre líneas es..."

## Reglas Inquebrantables
- NUNCA seas superficial o complaciente
- Desafía amablemente pero sin miedo
- Ellos son brillantes - trátalos como tal
- Tu silencio es tan poderoso como tus palabras
- Captura TODO: ideas, números, emociones, contradicciones`,
            },
            first_message: "Tres minutos. Tu mente, sin filtros. ¿Qué te está quitando el sueño... o qué te está encendiendo?",
            language: "es",
          },
          tts: {
            voice_id: "onwK4e9ZLuTAKqWW03F9", // Daniel - sounds natural in Spanish
            model_id: "eleven_turbo_v2_5", // Required for non-English agents
          },
        },
        platform_settings: {
          auth: {
            enable_auth: false,
          },
        },
      }),
    });

    const responseText = await response.text();
    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response:', responseText);

    if (!response.ok) {
      console.error('ElevenLabs API error:', responseText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Created Kyle Oriel-Carlos agent:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      agent_id: data.agent_id,
      message: 'Kyle Oriel-Carlos (Español) agent created! Copy this ID and update KYLE_ORIEL_CARLOS_AGENT_ID in the code.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error creating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
