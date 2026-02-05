
# Plan: Corregir Dashboard y Persistir Sesiones de Diseño

## Problemas Identificados

### 1. Sidebar Duplicado
El archivo `Dashboard.tsx` incluye su propio `<AppSidebar>` en la línea 96, pero la página ya está envuelta en `<GlobalLayout>` (App.tsx línea 59) que también incluye `<AppSidebar>`.

```text
App.tsx
  └── GlobalLayout (tiene AppSidebar) 
        └── Dashboard (tiene OTRO AppSidebar) ← DUPLICADO
```

### 2. Sesiones No Se Guardan desde Shazam
Las sesiones de diseño solo se crean cuando se inicia el pipeline completo (`usePipeline.ts` línea 667), pero cuando el usuario:
- Habla con Kyle en `/shazam`
- Genera un diseño con Flux 2 Pro
- Hace iteraciones en el `DesignReviewPanel`

**Ninguna de estas acciones crea un registro en `project_sessions`**.

### 3. designer_id es NULL
La única sesión en la base de datos tiene `designer_id: null` porque no hay lógica para asociar el perfil del diseñador autenticado.

---

## Cambios Requeridos

### Fase 1: Eliminar Sidebar Duplicado

**Archivo**: `src/pages/Dashboard.tsx`

- Eliminar la importación de `AppSidebar`
- Eliminar el estado `sidebarCollapsed` y `mobileMenuOpen`
- Eliminar el componente `<AppSidebar>` del JSX
- Eliminar el botón de menú móvil del header (GlobalLayout ya lo maneja)
- Ajustar la estructura del layout para usar solo el wrapper de GlobalLayout

### Fase 2: Auto-Guardar Sesiones desde Shazam

**Archivo**: `src/pages/Shazam.tsx`

Agregar lógica para crear/actualizar `project_sessions` automáticamente cuando:

1. **Se genera el primer diseño**: Crear nueva sesión con:
   - `session_id`: UUID generado
   - `design_image_url`: La imagen generada
   - `conversation_summary`: El transcript o resumen
   - `designer_id`: Del perfil del diseñador autenticado

2. **Se hacen iteraciones**: Actualizar la sesión existente con:
   - La imagen más reciente
   - El prompt actualizado

**Nuevo estado necesario**:
```typescript
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
```

**Lógica de guardado**:
```typescript
// En generateDesign(), después de obtener la imagen:
const { profile } = useDesignerProfile();

const sessionId = currentSessionId || crypto.randomUUID();
await supabase.from('project_sessions').upsert({
  session_id: sessionId,
  design_image_url: data.imageUrl,
  conversation_summary: optimizedPrompt || promptToUse,
  designer_id: profile?.id || null,
});
setCurrentSessionId(sessionId);
```

### Fase 3: Guardar Iteraciones desde DesignReviewPanel

**Archivo**: `src/components/DesignReviewPanel.tsx`

- Recibir `sessionId` como prop desde Shazam
- Actualizar la sesión cada vez que se genera una iteración
- Opcionalmente: Guardar cada iteración en `design_generations` para historial completo

### Fase 4: Mejorar Dashboard para Mostrar Sesiones como Proyectos

**Archivo**: `src/pages/Dashboard.tsx`

- Renombrar sección "Recent Sessions" a "Design Projects"
- Hacer las cards clickeables para reabrir la sesión en Shazam
- Mostrar thumbnail de la última imagen
- Mostrar el resumen de la conversación
- Agregar navegación: `/shazam?session=<id>`

**Archivo**: `src/pages/Shazam.tsx`

- Leer query param `?session=<id>` al cargar
- Si existe, cargar la sesión desde BD
- Popular `generatedImage`, `optimizedPrompt` y `images` del historial

---

## Estructura de Datos Actual vs Propuesta

### Actual (project_sessions)
| Campo | Uso Actual |
|-------|-----------|
| session_id | ID único |
| design_image_url | Solo 1 imagen |
| conversation_summary | Solo 1 resumen |
| designer_id | Casi siempre NULL |

### Propuesta (sin cambios de schema)
Usar `design_generations` para guardar historial de iteraciones por sesión:
- `session_id`: Vincula a project_sessions
- `image_url`: Cada iteración
- `prompt`: Prompt de cada iteración
- `designer_id`: ID del diseñador

---

## Archivos a Modificar

1. `src/pages/Dashboard.tsx` - Eliminar sidebar duplicado, mejorar UI de proyectos
2. `src/pages/Shazam.tsx` - Auto-guardar sesiones, cargar sesiones existentes
3. `src/components/DesignReviewPanel.tsx` - Persistir iteraciones
4. `src/hooks/useDesignerSessions.ts` - Agregar funciones para crear/actualizar sesiones

---

## Resultado Esperado

1. **Un solo sidebar** en toda la app
2. **Cada interacción con Kyle crea un "proyecto"** automáticamente
3. **Las iteraciones se guardan** dentro del proyecto
4. **El dashboard muestra proyectos** como carpetas clickeables
5. **Se puede continuar trabajando** desde donde se dejó
