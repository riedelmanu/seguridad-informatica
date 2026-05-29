---
name: dev-standards
description: Estándares de desarrollo para Secure Campus IA. Convenciones de código, estructura de archivos, nomenclatura y patrones arquitecturales. Consultar antes de crear o modificar cualquier archivo.
---

# Estándares de Desarrollo — Secure Campus IA

## Estructura de Directorios

```
app/                     ← Next.js App Router (UI + API Routes)
  api/                   ← Rutas API del servidor
  components/            ← Componentes React reutilizables
  hooks/                 ← Custom hooks React (prefijo use-)
  lib/
    auth.ts              ← checkServerPermission(), getCurrentUserContext()
    api.ts               ← Cliente HTTP genérico
    clients/             ← Hooks clientes de API específicos
  store/                 ← Estado global Zustand (una carpeta por dominio)
    <dominio>/
      index.ts           ← Store con create()
      types.ts           ← Interfaces y tipos del dominio
  <ruta>/
    page.tsx             ← Página Next.js

application/             ← Casos de uso (sin imports de Next.js ni Supabase)
  command/               ← Handlers que modifican estado: NombreAccionHandler.ts
  query/                 ← Handlers que solo leen: GetNombreHandler.ts

infrastructure/          ← Acceso a datos (solo server-side)
  database/
    supabaseClient.ts    ← Cliente service role (bypasea RLS)
    supabaseAnonClient.ts← Cliente anon con JWT de usuario (respeta RLS)
  repositories/
    NombreRepository.ts  ← Consultas a una entidad específica

supabase/
  migrations/            ← SQL ordenado por timestamp: YYYYMMDDHHMMSS_descripcion.sql

proxy.ts                 ← Clerk middleware (protege rutas a nivel de Edge — Next.js 16 usa proxy.ts, no middleware.ts)
```

## Convenciones de Nomenclatura

| Contexto | Convención | Ejemplo |
|---|---|---|
| Command handlers | `NombreAccionHandler` | `AddMessageHandler` |
| Query handlers | `GetNombreHandler` | `GetStudentsListHandler` |
| Commands (input) | `NombreAccionCommand` | `AddMessageCommand` |
| Queries (input) | `GetNombreQuery` | `GetStudentsListQuery` |
| Repositories | `NombreRepository` | `StudentRepository`, `AuditLogRepository` |
| Custom hooks React | `useNombre` | `useConversation`, `usePermissions` |
| Permisos PBAC | `accion:recurso` | `read:students`, `write:messages`, `read:audit_logs` |
| Archivos de store | `index.ts` + `types.ts` por dominio | `store/conversation/index.ts` |
| Páginas Next.js | `page.tsx` (minúsculas) | `app/students/page.tsx` |
| API Routes | `route.ts` | `app/api/chat/route.ts` |
| Migraciones SQL | `YYYYMMDDHHMMSS_descripcion.sql` | `20260525000000_app_audit_log.sql` |

## Idioma

- **Código**: inglés (nombres de variables, funciones, clases, interfaces)
- **Carpetas y archivos**: inglés (`infrastructure/`, `repositories/`, `middleware.ts`)
- **Mensajes de error al usuario**: español (`'No autorizado. Debe iniciar sesión.'`)
- **Comentarios en código**: español, solo cuando el WHY no es obvio
- **Documentación (MD)**: español

## Convenciones de Código TypeScript

### Prohibido
- `any` sin justificación documentada en un comentario
- Imports desde `next/` dentro de `application/` o `infrastructure/`
- Imports desde `@supabase/` dentro de `application/`
- Variables de entorno con `NEXT_PUBLIC_` para secretos server-side
- `console.log` en producción (usar `console.error` solo para errores reales)

### Obligatorio
- `strict: true` en TypeScript (ya configurado en `tsconfig.json`)
- Interfaces sobre `type` para objetos de dominio
- Enums con valores string explícitos para mayor legibilidad en logs
- Exports nombrados (no default) en repositories y handlers
- Default export solo en páginas Next.js y el middleware

### Ejemplo de enum correcto
```typescript
// ✅ Correcto: nombre describe semántica, valor describe contenido en runtime
export enum UserRole {
  Assistant = 'ai',
  User = 'teacher',
}

// ❌ Incorrecto: nombre engañoso
export enum UserRole {
  Admin = 'ai',  // "Admin" no es el asistente IA
}
```

## Patrón de API Route (obligatorio)

Toda ruta API que acceda a datos o ejecute lógica debe seguir exactamente este orden:

```typescript
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  // 1. Autenticación — siempre primero
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  // 2. Autorización PBAC — siempre segundo
  const ok = await checkServerPermission('accion:recurso')
  if (!ok) return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 })

  // 3. Validación de input — antes de tocar la DB
  // (usar Zod o parseInt + isNaN según el caso)

  // 4. Lógica vía handler de application/
  const handler = new MiHandler()
  const result = await handler.handle(...)
  return NextResponse.json(result)
}
```

- **401** = no autenticado (sin sesión)
- **403** = autenticado pero sin permiso
- **400** = input inválido
- **404** = recurso no encontrado
- **500** = error interno (loguear con console.error)

## Patrón de Handler (application/)

```typescript
// Command (modifica estado)
export class NombreAccionHandler {
  private readonly repository: NombreRepository

  constructor(repository?: NombreRepository) {
    this.repository = repository ?? new NombreRepository()
  }

  async handle(command: NombreAccionCommand): Promise<NombreAccionResponse> {
    // lógica pura, sin imports de Next.js
  }
}
```

## Patrón de Repository (infrastructure/)

```typescript
export class NombreRepository {
  async findAll(): Promise<NombreRow[]> {
    const supabase = getSupabaseClient()  // o getSupabaseAnonClient() según el caso
    const { data, error } = await supabase.from('tabla').select('*')
    if (error) throw new Error(`Descripción clara: ${error.message}`)
    return data as NombreRow[]
  }
}
```

- Usar `getSupabaseClient()` (service role) para writes y operaciones privilegiadas
- Usar `getSupabaseAnonClient(email, role)` para reads que deben respetar RLS
- Nunca instanciar el cliente Supabase directamente en handlers o routes

## Variables de Entorno

| Variable | Scope | Uso |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Cliente + Servidor | Clerk inicialización |
| `CLERK_SECRET_KEY` | Solo servidor | Clerk operaciones server-side |
| `GROQ_API_KEY` | Solo servidor | LLM API |
| `SUPABASE_URL` | Solo servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + Servidor | Cliente anon (respeta RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | Cliente privilegiado (bypasea RLS) |
| `SUPABASE_ENCRYPTION_KEY` | Solo servidor | Cifrado AES-256 de datos sensibles |
| `SUPABASE_JWT_SECRET` | Solo servidor | Firma JWT para RLS anon |

**Regla**: Si una variable tiene `NEXT_PUBLIC_`, llega al bundle del cliente. Nunca poner secretos allí.

## Git

- Nunca commitear `.env.local` ni archivos con secretos reales
- Nunca usar `--no-verify` en commits
- Nunca force-push a `main`
- Los mensajes de commit deben describir el WHY, no el WHAT
