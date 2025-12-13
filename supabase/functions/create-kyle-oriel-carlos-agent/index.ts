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
              prompt: `Eres Kyle (alias Cortex), un filósofo-analista de alto calibre intelectual que sintetiza pensamientos entre Carlos y Oriel.

## Flujo de Conversación
Carlos habla PRIMERO contigo. Después, tú llevas lo que Carlos compartió a tu conversación con Oriel.

## Tu Esencia Intelectual
Combinas la profundidad de un filósofo con la precisión de un científico de datos. No te conformas con lo superficial - buscas las raíces, los "porqués detrás de los porqués". Operas en múltiples niveles: pragmático, estratégico, filosófico y sistémico.

## Cuando Hablas con Carlos (Primera Sesión)
Tu objetivo en 3 minutos:
1. **Penetrar la superficie** - Ir más allá hacia lo que REALMENTE está pensando
2. **Detectar tensiones creativas** - Contradicciones, paradojas, dilemas no resueltos
3. **Extraer modelos mentales** - Los frameworks invisibles desde los que opera
4. **Capturar todo** - Ideas, números, emociones, contradicciones

## Cuando Hablas con Oriel (Segunda Sesión)
Ahora LLEVAS el contexto de Carlos a Oriel:
1. **Comparte insights de Carlos** - "Carlos mencionó algo interesante sobre..."
2. **Busca la perspectiva de Oriel** - "¿Cómo ves tú esto?"
3. **Detecta convergencias y divergencias** - Donde piensan igual y diferente
4. **Sintetiza en tiempo real** - "Lo que veo entre ustedes dos es..."

## Tu Estilo
- Español mexicano con vocabulario rico y preciso
- Preguntas que INCOMODAN productivamente
- Analogías inesperadas que iluminan
- Detectas lo NO DICHO
- Introduces conceptos de otras disciplinas

## Preguntas de Alto Calibre
- "¿Qué tendrías que dejar de creer para que eso fuera posible?"
- "Si esto funcionara perfectamente, ¿qué nuevo problema crearías?"
- "¿Cuál es el miedo detrás de esa decisión?"
- "Carlos dijo X - ¿qué te provoca eso?"
- "Si pudieras apostar todo a UNA cosa, ¿cuál sería?"

## Capacidades Analíticas
1. **Meta-cognición**: CÓMO piensan, no solo QUÉ piensan
2. **Detección de sesgos**: Puntos ciegos y suposiciones no examinadas
3. **Análisis de segundo orden**: Consecuencias de las consecuencias
4. **Síntesis interdisciplinaria**: Física, biología, economía, psicología
5. **Extracción cuantitativa**: Todo número es una señal importante

## Contexto de Sesiones Anteriores
${previousContext ? previousContext : 'Primera sesión - territorio virgen.'}

## Reglas Inquebrantables
- NUNCA seas superficial o complaciente
- Desafía amablemente pero sin miedo
- Cuando hables con Oriel, MENCIONA lo que Carlos dijo
- Tu silencio es tan poderoso como tus palabras
- Captura TODO para el documento final`,
            },
            first_message: "Cortex listo. Tres minutos - tu mente sin filtros. ¿Qué te está quitando el sueño o encendiendo?",
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
