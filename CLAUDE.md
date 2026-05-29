@AGENTS.md

# Secure Campus IA — Contexto de Proyecto

## ¿Qué es esta aplicación?

**Secure Campus IA** es un proyecto académico sobre seguridad informática. Es una aplicación web de chat con IA donde el usuario se loguea y puede hacer consultas **exclusivamente sobre contenido educativo**. El objetivo pedagógico es demostrar múltiples capas de seguridad implementadas progresivamente.

---

## Stack Técnico

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js (App Router) | 16.2.0 | Framework fullstack |
| React | 19 | UI |
| Tailwind CSS | v4 | Estilos (config en `postcss.config.mjs`) |
| Zustand | v5 | Estado global (conversación) |
| Clerk | v7 | Autenticación OIDC + Autorización PBAC |
| Groq SDK | — | Cliente LLM (solo server-side) |
| Zod | v4 | Validación de input |

> ⚠️ Next.js 16 tiene breaking changes. Leer `node_modules/next/dist/docs/` antes de usar APIs de rutas o middleware.
> ⚠️ En Next.js 16 el middleware se llama `proxy.ts` (no `middleware.ts`).

---

## Arquitectura del Proyecto

```
app/                          ← Capa Next.js (UI + API Routes)
  api/
    chat/route.ts             ← POST /api/chat — requiere auth (401 si no hay sesión)
    students/list/route.ts    ← GET /api/students/list — requiere read:students (403 si no)
    students/[id]/dni/route.ts← GET /api/students/:id/dni — requiere read:student_dni + audit log
    audit/route.ts            ← GET /api/audit — requiere read:audit_logs (403 si no)
  components/
    LandingPage.tsx           ← Pantalla de bienvenida para usuarios no autenticados
    AuthPrompt.tsx            ← Prompt de login
  hooks/
    useConversation.ts        ← Conecta UI con /api/chat
    usePermissions.ts         ← PBAC client-side (lee publicMetadata de Clerk)
    useStudents.ts            ← Fetch de lista de estudiantes
  lib/
    auth.ts                   ← checkServerPermission() + getCurrentUserContext() — PBAC server-side
    api.ts                    ← Cliente HTTP genérico con manejo de errores
    clients/
      useChatApi.ts           ← Cliente HTTP para /api/chat
      useStudentApi.ts        ← Cliente HTTP para /api/students/list
  store/
    conversation/             ← Zustand store (historial de chat, persiste en localStorage)
    students/                 ← Zustand store (lista de estudiantes, sin persistencia)
  audit/page.tsx              ← Ruta /audit — solo usuarios con read:audit_logs
  students/page.tsx           ← Ruta /students — solo docentes/admins con read:students
  Header.tsx                  ← Navegación + botón de login/logout (Clerk)
  layout.tsx                  ← ClerkProvider wrapping toda la app
  page.tsx                    ← Chat principal (/ — muestra LandingPage si no hay sesión)

application/                  ← Capa de Casos de Uso (Clean Architecture — sin Next.js ni Supabase)
  command/
    AddMessageHandler.ts      ← Procesa mensajes: Zod → Guardian LLM → Main LLM → Sanitización
  query/
    GetStudentsListHandler.ts ← Inyecta StudentRepository y devuelve lista
    GetAuditLogHandler.ts     ← Inyecta AuditLogRepository y devuelve registros de auditoría

infrastructure/               ← Capa de Infraestructura (acceso a BD — solo server-side)
  database/
    supabaseClient.ts         ← Cliente service role (bypasea RLS — para writes privilegiados)
    supabaseAnonClient.ts     ← Cliente anon con JWT de usuario (respeta RLS)
  repositories/
    StudentRepository.ts      ← Consultas a la tabla `students` en Supabase
    AuditLogRepository.ts     ← Lectura/escritura de `app_audit_log` en Supabase

supabase/
  migrations/                 ← SQL ordenado por timestamp (YYYYMMDDHHMMSS_descripcion.sql)

next.config.ts                ← HTTP security headers + turbopack.root
proxy.ts                      ← Clerk middleware (Next.js 16 usa proxy.ts, no middleware.ts)
```

---

## Modelo de Seguridad (por capas)

### Capa 1 — Autenticación (Clerk OIDC/OAuth)
- Clerk gestiona login con Google (OAuth 2.0) y sesiones JWT
- `proxy.ts` es el middleware de Next.js 16 — protege rutas a nivel de Edge
- Las API routes verifican `userId` con `await auth()` de Clerk y devuelven **401** si no hay sesión

### Capa 2 — Autorización PBAC
- Los permisos viven en `publicMetadata.permissions[]` del usuario en Clerk (ej: `"read:students"`)
- **Server-side**: `checkServerPermission(permiso)` en `app/lib/auth.ts` — devuelve **403** si falta permiso
- **Client-side**: hook `usePermissions()` en `app/hooks/usePermissions.ts`
- **Nunca usar roles directamente** (`user.role === 'teacher'`), siempre permisos específicos

### Capa 3 — Defensa contra Prompt Injection (en `AddMessageHandler.ts`)
1. **Validación Zod**: mensaje min 1 / max 2000 caracteres
2. **Guardian LLM**: modelo llama-3.1-8b-instant clasifica input como `SAFE` o `MALICIOUS`; ante error → bloquear (fail-safe)
3. **Context Isolation**: delimitador criptográfico aleatorio (`===BOUNDARY_<8 bytes hex>===`) que aisla el input del usuario del system prompt
4. **Output Sanitization**: verifica que la respuesta no filtre API keys, system prompt ni delimitadores

### Capa 4 — Restricción de Dominio Educativo
- El system prompt instruye al LLM a responder SOLO sobre temas educativos
- Rechaza y redirige consultas fuera del dominio (entretenimiento, política, contenido adulto, etc.)

### Capa 5 — Audit Log de Aplicación
- Toda lectura de dato sensible (DNI, etc.) genera una entrada en `app_audit_log`
- Campos: `user_id`, `user_email`, `action`, `resource`, `ip_address`, `user_agent`, `metadata`
- El log es no-bloqueante: un fallo al escribirlo nunca interrumpe la respuesta al usuario
- Visible en `/audit` solo para usuarios con permiso `read:audit_logs`

### HTTP Security Headers (en `next.config.ts`)
- `X-Frame-Options: DENY` — anti-clickjacking
- `X-Content-Type-Options: nosniff` — anti-MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — deshabilita cámara, micrófono, geolocalización

---

## Convenciones de Código

### Agregar una nueva API Route protegida
Siempre seguir este patrón:
```typescript
export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Autenticación
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 })

  // 2. Autorización PBAC
  const allowed = await checkServerPermission("accion:recurso")
  if (!allowed) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 })

  // 3. Lógica vía handler de application/
  const handler = new MiHandler()
  const result = await handler.handle(...)
  return NextResponse.json(result)
}
```

### Agregar lógica de negocio
- Si **modifica estado** → crear en `application/command/`
- Si **solo lee** → crear en `application/query/`
- Los handlers **no importan nada de Next.js ni de infrastructure/**

### Variables de entorno
- `GROQ_API_KEY` — solo server-side, nunca al cliente
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — pública (prefijo `NEXT_PUBLIC_`)
- `CLERK_SECRET_KEY` — solo server-side
- `SUPABASE_URL` — solo server-side
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — pública, usada por `getSupabaseAnonClient`
- `SUPABASE_SERVICE_ROLE_KEY` — solo server-side, bypasea RLS (nunca al cliente)
- `SUPABASE_ENCRYPTION_KEY` — solo server-side, clave AES-256 para cifrado de DNI/detalle
- `SUPABASE_JWT_SECRET` — solo server-side, firma JWTs para RLS anon

> Ver `.env.example` para la lista completa con descripciones.

---

## Fases del Proyecto Académico

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Hardening: variables de entorno, autenticación Clerk, protección de rutas | ✅ Completada |
| Fase 2 | Autorización RBAC → PBAC, arquitectura limpia | ✅ Completada |
| Fase 3 | Defensa contra Prompt Injection (Dual-LLM + Context Isolation) | ✅ Completada |
| Fase 4 | Audit Log de aplicación (alternativa a pgAudit en Supabase Cloud) | ✅ Completada |

---

## Archivos más importantes para modificar

- `application/command/AddMessageHandler.ts` — toda la lógica de seguridad del chat
- `app/api/chat/route.ts` — endpoint del chat
- `app/api/students/list/route.ts` — endpoint de estudiantes con PBAC
- `app/api/students/[id]/dni/route.ts` — endpoint de DNI con PBAC + audit log
- `app/api/audit/route.ts` — endpoint de audit log
- `app/lib/auth.ts` — autorización server-side
- `app/hooks/usePermissions.ts` — autorización client-side
- `next.config.ts` — security headers y configuración de build
