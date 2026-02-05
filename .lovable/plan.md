

# Plan: Corregir Image-to-Image en Flux 2 Pro

## Diagnóstico del Problema

He identificado la causa raíz del problema de consistencia en las iteraciones:

**El código actual usa parámetros INCORRECTOS para Flux 2 Pro:**

```text
┌─────────────────────────────────────────────────────────────┐
│  CÓDIGO ACTUAL (INCORRECTO)                                 │
├─────────────────────────────────────────────────────────────┤
│  input.image_prompt = referenceImage                        │
│  input.image_prompt_strength = 0.70                         │
│                                                             │
│  ❌ Estos parámetros NO EXISTEN en Flux 2 Pro               │
│  ❌ El modelo los ignora completamente                      │
│  ❌ Genera una imagen nueva sin referencia                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PARÁMETROS CORRECTOS según documentación                   │
├─────────────────────────────────────────────────────────────┤
│  input.input_images = [referenceImageUrl]  (array)          │
│                                                             │
│  ✅ El modelo usa la imagen como referencia visual          │
│  ✅ Mantiene la composición y elementos arquitectónicos     │
└─────────────────────────────────────────────────────────────┘
```

## Modelo en Uso

- **Modelo**: `black-forest-labs/flux-2-pro` via Replicate API
- **Versión SDK**: `replicate@0.25.2`
- **Capacidad**: Soporta hasta 8 imágenes de referencia

## Cambios Requeridos

### 1. Actualizar Edge Function `blink-design`

Modificar `supabase/functions/blink-design/index.ts`:

**Antes (líneas 156-160):**
```typescript
if (referenceImage) {
  input.image_prompt = referenceImage;           // ❌ Parámetro incorrecto
  input.image_prompt_strength = 0.70;            // ❌ No existe
}
```

**Después:**
```typescript
if (referenceImage) {
  input.input_images = [referenceImage];         // ✅ Array de URLs
  input.aspect_ratio = "match_input_image";      // ✅ Mantener proporción
}
```

### 2. Mejorar el Prompt para Edición

Cuando hay una imagen de referencia, el prompt debe ser más específico sobre qué mantener y qué cambiar:

```typescript
if (referenceImage) {
  const editingPrompt = `Edit this interior design image: ${refinedChanges}. 
Keep the same room layout, camera angle, and architectural structure. 
Only modify the specific elements mentioned.`;
}
```

### 3. Agregar Logging Mejorado

Para debugging futuro:

```typescript
console.log("[blink-design] Input parameters:", JSON.stringify({
  hasReferenceImage: !!referenceImage,
  aspectRatio: input.aspect_ratio,
  promptLength: finalImagePrompt.length,
  inputImagesCount: input.input_images?.length || 0
}));
```

## Resumen Técnico

| Aspecto | Antes | Después |
|---------|-------|---------|
| Parámetro imagen | `image_prompt` (inexistente) | `input_images` (array) |
| Control fuerza | `image_prompt_strength` | No necesario (el prompt controla) |
| Aspect ratio | `"1:1"` fijo | `"match_input_image"` cuando hay ref |
| Tipo de prompt | Mismo para todo | Diferenciado: generación vs edición |

## Resultado Esperado

Después de este cambio:
1. La primera imagen se genera normalmente desde el transcript
2. Las iteraciones reciben la imagen anterior como `input_images[0]`
3. El modelo edita la imagen existente en lugar de generar una nueva
4. Se mantiene la consistencia arquitectónica y de composición

