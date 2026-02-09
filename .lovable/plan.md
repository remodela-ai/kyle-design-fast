
# Plan: Kyle Multi-Tenant con Connectors Personalizados

## Resumen Ejecutivo
Implementar una arquitectura multi-tenant donde cada diseñador puede conectar sus propias cuentas (Gmail, Google Calendar, Notion) y Kyle usará esos connectors automáticamente al ejecutar tareas, sin que el usuario final sepa que está usando un servicio externo.

## Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────┐
│                    DISEÑADOR A                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │   Gmail   │  │ Calendar  │  │  Notion   │               │
│  │ connector │  │ connector │  │ connector │               │
│  │  uuid-a1  │  │  uuid-a2  │  │  uuid-a3  │               │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘               │
│        └──────────────┼──────────────┘                      │
│                       ▼                                     │
│              ┌────────────────┐                             │
│              │  Kyle Voice    │                             │
│              │  (por usuario) │                             │
│              └────────┬───────┘                             │
└───────────────────────┼─────────────────────────────────────┘
                        ▼
              ┌─────────────────────┐
              │  kyle-manus-bridge  │
              │  (lee connectors    │
              │   del team_member)  │
              └─────────────────────┘
```

## Cambios Requeridos

### 1. Base de Datos - Nueva Tabla `kyle_connectors`

Crear una tabla para almacenar los connectors de cada team member:

```sql
CREATE TYPE connector_type AS ENUM ('gmail', 'google_calendar', 'notion', 'slack', 'github', 'google_drive');

CREATE TABLE kyle_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    connector_type connector_type NOT NULL,
    connector_uuid TEXT NOT NULL,  -- UUID del connector en el servicio externo
    display_name TEXT,             -- Ej: "Mi Gmail personal"
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_member_id, connector_type)  -- Un connector de cada tipo por usuario
);

-- RLS Policies
ALTER TABLE kyle_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connectors"
ON kyle_connectors FOR SELECT
USING (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage their own connectors"
ON kyle_connectors FOR ALL
USING (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));
```

### 2. UI - Panel de Configuración de Connectors

Crear `src/pages/kustr/KyleConnectors.tsx`:

- Lista de connectors disponibles (Gmail, Calendar, Notion, etc.)
- Estado de conexión de cada uno (conectado/desconectado)
- Botón para conectar que abre popup de OAuth en el servicio externo
- Botón para desconectar
- Campo para ingresar el UUID del connector manualmente

Diseño visual:
```text
┌─────────────────────────────────────────────┐
│  Conecta tus Herramientas con Kyle          │
├─────────────────────────────────────────────┤
│  📧 Gmail                    [✓ Conectado]  │
│     Kyle puede leer y gestionar tu correo   │
│                                             │
│  📅 Google Calendar         [Conectar →]    │
│     Kyle puede agendar y revisar citas      │
│                                             │
│  📝 Notion                  [Conectar →]    │
│     Kyle accede a tu base de conocimiento   │
│                                             │
│  💬 Slack                   [Conectar →]    │
│     Kyle puede enviar notificaciones        │
└─────────────────────────────────────────────┘
```

### 3. Edge Function - Actualizar `kyle-manus-bridge`

Modificar para recibir el `team_member_id` y cargar sus connectors:

```typescript
// Pseudocódigo de la lógica
async function getConnectorsForUser(teamMemberId: string) {
  const { data: connectors } = await supabase
    .from('kyle_connectors')
    .select('connector_type, connector_uuid')
    .eq('team_member_id', teamMemberId)
    .eq('is_active', true);
  
  return connectors.map(c => c.connector_uuid);
}

// En el payload a la API externa:
const taskPayload = {
  prompt: enhancedPrompt,
  connectors: await getConnectorsForUser(context.team_member_id),
};
```

### 4. Hook - Actualizar `useKyleAgentActions`

Incluir automáticamente el `team_member_id` del contexto:

```typescript
// En useKyleAgentActions.ts
import { useKustrOffice } from "@/contexts/KustrOfficeContext";

const { teamMember } = useKustrOffice();

const executeTask = async (command, context, actionType) => {
  await supabase.functions.invoke('kyle-manus-bridge', {
    body: {
      command,
      context: {
        ...context,
        team_member_id: teamMember?.id,
        office_id: teamMember?.office_id,
      },
      action_type: actionType,
    }
  });
};
```

### 5. Sidebar - Mostrar Connectors Activos

Agregar indicadores en `KyleSkillsSidebar.tsx`:

```typescript
// Mostrar qué herramientas tiene conectadas el usuario
{connectedTools.length > 0 && (
  <div className="flex gap-1">
    {connectedTools.includes('gmail') && <Mail className="w-4 h-4" />}
    {connectedTools.includes('google_calendar') && <Calendar className="w-4 h-4" />}
    {connectedTools.includes('notion') && <FileText className="w-4 h-4" />}
  </div>
)}
```

## Flujo de Usuario

1. **Configuración inicial**: El diseñador va a Configuración → Kyle → Conectar Herramientas
2. **Conexión OAuth**: Clickea "Conectar Gmail" → Se abre ventana de OAuth → Autoriza → Sistema guarda el UUID
3. **Uso diario**: El diseñador habla con Kyle: "Revisa mi correo y agenda una cita con el cliente"
4. **Ejecución**: Kyle automáticamente usa los connectors del usuario para acceder a Gmail y Calendar
5. **Multi-usuario**: Cada diseñador tiene sus propias conexiones, totalmente aisladas

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/migrations/xxx_kyle_connectors.sql` | Crear | Tabla y políticas RLS |
| `src/pages/kustr/KyleConnectors.tsx` | Crear | UI para gestionar connectors |
| `src/hooks/useKyleConnectors.ts` | Crear | Hook para CRUD de connectors |
| `supabase/functions/kyle-manus-bridge/index.ts` | Modificar | Cargar connectors del usuario |
| `src/hooks/useKyleAgentActions.ts` | Modificar | Pasar team_member_id |
| `src/components/KyleSkillsSidebar.tsx` | Modificar | Mostrar connectors activos |
| `src/App.tsx` | Modificar | Agregar ruta `/kyle-connectors` |

## Consideraciones de Seguridad

1. **Aislamiento de datos**: RLS asegura que cada usuario solo ve sus propios connectors
2. **UUIDs del servicio externo**: Se almacenan en la DB pero nunca se exponen al frontend
3. **Validación en edge function**: Verificar que el team_member_id corresponde al usuario autenticado
4. **Sin menciones externas**: La UI solo habla de "Kyle" y "herramientas conectadas"

## Sección Técnica

### Estructura de la tabla `kyle_connectors`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `team_member_id` | UUID | FK → team_members |
| `office_id` | UUID | FK → offices (para RLS eficiente) |
| `connector_type` | ENUM | gmail, google_calendar, notion, slack, github, google_drive |
| `connector_uuid` | TEXT | UUID del connector en el servicio externo |
| `display_name` | TEXT | Nombre personalizado opcional |
| `is_active` | BOOLEAN | Para desactivar sin eliminar |
| `connected_at` | TIMESTAMPTZ | Fecha de conexión original |
| `last_used_at` | TIMESTAMPTZ | Última vez que Kyle usó este connector |

### API del servicio externo - Connectors

```typescript
// POST /v1/tasks con connectors
{
  "prompt": "Revisa mi correo y resume los emails urgentes",
  "connectors": [
    "ab7e-450f-9cb9-b9467fb0adda",  // Gmail UUID del usuario
    "2f4f-4d33-8fcf-51664ea15c00"   // Notion UUID del usuario
  ]
}
```

### Hook useKyleConnectors

```typescript
interface Connector {
  id: string;
  connector_type: ConnectorType;
  display_name: string | null;
  is_active: boolean;
  connected_at: string;
}

function useKyleConnectors() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  
  const addConnector = async (type: ConnectorType, uuid: string) => { ... };
  const removeConnector = async (id: string) => { ... };
  const toggleConnector = async (id: string, active: boolean) => { ... };
  
  return { connectors, addConnector, removeConnector, toggleConnector };
}
```
