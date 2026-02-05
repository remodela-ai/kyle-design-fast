

# Plan: Smart Project Folders con Versionado Multi-Tenant

## Análisis del Sistema Actual

### Estado de las Tablas

| Tabla | Uso Actual | Problema |
|-------|-----------|----------|
| `project_sessions` | Solo imagen + resumen | No guarda iteraciones ni vincula pipeline |
| `pipeline_steps` | Guarda pasos del pipeline | No tiene RLS, cualquiera puede ver todo |
| `design_generations` | **Vacía, sin usar** | Ya tiene schema ideal para iteraciones |
| `designer_profiles` | Perfiles de diseñadores | Bien configurada |

### Datos en DB Actualmente

```text
project_sessions: 3 registros
  - 2 con designer_id: NULL (no asociados)
  - 1 con designer_id asignado (sesión actual: 90a1e9d5...)

pipeline_steps: ~1500+ registros
  - Sin RLS real (políticas públicas)
  - Todos los usuarios ven todos los pipelines

design_generations: 0 registros
  - No se está usando
```

---

## Arquitectura Propuesta: Smart Project Folders

### Concepto

Cada **Project Session** se convierte en un "Smart Folder" que contiene:

1. **Imagen Principal**: El diseño aprobado actual
2. **Historial de Versiones**: Todas las iteraciones (design_generations)
3. **Documentos del Pipeline**: Los 16 pasos (Visual + Management)
4. **Acceso Multi-Tenant**: Cada diseñador ve solo sus proyectos, Super Admin ve todo

### Diagrama de Relaciones

```text
designer_profiles (1)
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
project_sessions (N)   design_generations (N)
       │                  │
       │                  └── (versiones/iteraciones)
       │
       └──► pipeline_steps (16 por sesión)
             ├── Visual Steps (1-8)
             └── Management Steps (1-8)
```

---

## Cambios de Base de Datos

### 1. Agregar columnas a `project_sessions`

```sql
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS pipeline_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS management_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS iteration_count INTEGER DEFAULT 0;
```

### 2. Agregar `designer_id` a `pipeline_steps`

```sql
ALTER TABLE pipeline_steps ADD COLUMN IF NOT EXISTS designer_id UUID;
```

### 3. Crear RLS para `project_sessions` (Multi-Tenant)

```sql
-- Política: Diseñadores ven solo sus proyectos
CREATE POLICY "Designers can view own projects"
  ON project_sessions FOR SELECT
  USING (
    designer_id IN (
      SELECT id FROM designer_profiles WHERE user_id = auth.uid()
    )
    OR designer_id IS NULL  -- Legacy projects sin asignar
  );

-- Política: Super Admin ve todos los proyectos
CREATE POLICY "Super admin can view all projects"
  ON project_sessions FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'oriel@copilotinnovations.com'
  );
```

### 4. Crear RLS para `pipeline_steps`

```sql
-- Política: Usuarios ven solo pasos de sus proyectos
CREATE POLICY "Users can view own pipeline steps"
  ON pipeline_steps FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM project_sessions 
      WHERE designer_id IN (
        SELECT id FROM designer_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Política: Super Admin ve todos los pasos
CREATE POLICY "Super admin can view all pipeline steps"
  ON pipeline_steps FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'oriel@copilotinnovations.com'
  );
```

---

## Cambios en el Frontend

### 1. Nuevo Hook: `useProjectFolder`

Crear `src/hooks/useProjectFolder.ts`:

```typescript
// Maneja un proyecto individual como "Smart Folder"
interface ProjectFolder {
  session: ProjectSession;
  iterations: DesignGeneration[];
  pipelineSteps: PipelineStep[];
  managementSteps: PipelineStep[];
}

export function useProjectFolder(sessionId: string) {
  // Cargar sesión + iteraciones + pipeline steps
  // Funciones: addIteration, updateSession, runKyleReview
}
```

### 2. Modificar `useDesignerSessions`

- Agregar filtrado por rol (Super Admin vs Designer)
- Incluir conteo de iteraciones y estado del pipeline
- Agregar método `getAllSessions()` para Super Admin

### 3. Nueva Página: Project Detail View

Crear `src/pages/ProjectDetail.tsx`:

```text
/project/:sessionId

┌─────────────────────────────────────────────────────────────┐
│  Project: Mountain Living Room                              │
│  Status: Pipeline Complete ✓    Last edited: 5 min ago     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │              │  │  VERSIONS (5)                        │ │
│  │   Approved   │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │ │
│  │   Design     │  │  │ v1  │ │ v2  │ │ v3  │ │ v4  │    │ │
│  │              │  │  └─────┘ └─────┘ └─────┘ └─────┘    │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                                                             │
│  PIPELINE DOCUMENTATION                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Spatial  │ Plans    │ Moodboard│ Flatlay  │  ...        │
│  │   ✓      │   ✓      │    ✓     │    ✓     │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                             │
│  MANAGEMENT DOCS                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Proposal │   BOM    │ Timeline │  Specs   │  ...        │
│  │   ✓      │   ✓      │    ✓     │    ✓     │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                             │
│  [ 🎙️ Talk to Kyle about this project ]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Modificar Dashboard

Actualizar `src/pages/Dashboard.tsx`:

- Mostrar estado del pipeline en cada card
- Indicar número de iteraciones
- Para Super Admin: mostrar toggle "Ver todos los proyectos"
- Agregar filtros por estado (Active, Pipeline Complete, etc.)

### 5. Guardar Iteraciones en `design_generations`

Modificar `src/pages/Shazam.tsx` y `DesignReviewPanel.tsx`:

```typescript
// Al generar cada iteración, guardar en design_generations
await supabase.from('design_generations').insert({
  designer_id: profile.id,
  session_id: currentSessionId,
  image_url: data.imageUrl,
  prompt: optimizedPrompt,
  metadata: { iteration: iterationNumber, referenceUsed: !!referenceImage }
});
```

### 6. Vincular Pipeline al Designer

Modificar `usePipeline.ts`:

```typescript
// Al crear pipeline_steps, incluir designer_id
const stepsToInsert = PIPELINE_STEPS.map(s => ({
  session_id: newSessionId,
  step_number: s.number,
  step_name: s.name,
  status: "pending",
  designer_id: designerId || null, // NUEVO
}));
```

---

## Flujo de Datos Multi-Tenant

### Diseñador Normal

```text
1. Login → designer_profiles.user_id = auth.uid()
2. Dashboard → project_sessions WHERE designer_id = profile.id
3. Crear proyecto → INSERT con designer_id = profile.id
4. Ver pipeline → pipeline_steps via session_id
```

### Super Admin

```text
1. Login → email = 'oriel@copilotinnovations.com'
2. Dashboard → ALL project_sessions (toggle disponible)
3. Puede ver proyectos de cualquier diseñador
4. No puede modificar proyectos de otros (solo lectura)
```

---

## Kyle en el Contexto del Proyecto

### Nueva funcionalidad: "Talk to Kyle about this project"

En la página de detalle del proyecto, Kyle podrá:

1. **Revisar toda la documentación** del pipeline
2. **Sugerir modificaciones** basadas en el historial
3. **Generar nuevas iteraciones** manteniendo contexto
4. **Responder preguntas** sobre el proyecto específico

Esto requiere crear un nuevo agente de ElevenLabs específico para revisión de proyectos que reciba el contexto completo del folder.

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/hooks/useProjectFolder.ts` | Crear | Hook para manejar un proyecto como folder |
| `src/pages/ProjectDetail.tsx` | Crear | Vista detallada del proyecto |
| `src/hooks/useDesignerSessions.ts` | Modificar | Agregar soporte multi-tenant |
| `src/pages/Dashboard.tsx` | Modificar | Toggle Super Admin, estados |
| `src/pages/Shazam.tsx` | Modificar | Guardar iteraciones |
| `src/components/DesignReviewPanel.tsx` | Modificar | Guardar en design_generations |
| `src/hooks/usePipeline.ts` | Modificar | Agregar designer_id a steps |
| `src/App.tsx` | Modificar | Agregar ruta /project/:id |

### Migraciones SQL

1. Agregar columnas a `project_sessions`
2. Agregar `designer_id` a `pipeline_steps`
3. Crear políticas RLS multi-tenant para ambas tablas

---

## Resultado Esperado

1. **Smart Folders**: Cada proyecto contiene diseño + versiones + documentos
2. **Versionado Completo**: Todas las iteraciones guardadas y navegables
3. **Pipeline Integrado**: Los 16 documentos asociados al proyecto
4. **Multi-Tenant**: Diseñadores ven solo sus proyectos
5. **Super Admin View**: Oriel puede ver todos los proyectos del estudio
6. **Kyle Contextual**: Puede revisar y discutir proyectos específicos

