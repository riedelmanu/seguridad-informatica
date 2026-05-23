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

---

## Arquitectura del Proyecto

```
app/                        ← Capa Next.js (UI + API Routes)
  api/
    chat/route.ts           ← POST /api/chat — requiere auth (401 si no hay sesión)
    students/list/route.ts  ← GET /api/students/list — requiere permiso read:students (403 si no)
  components/
    LandingPage.tsx         ← Pantalla de bienvenida para usuarios no autenticados
    AuthPrompt.tsx          ← Prompt de login
  hooks/
    useConversation.ts      ← Conecta UI con /api/chat
    usePermissions.ts       ← PBAC client-side (lee publicMetadata de Clerk)
    useStudents.ts          ← Fetch de lista de estudiantes
  lib/
    auth.ts                 ← checkServerPermission() — PBAC server-side
    clients/
      useChatApi.ts         ← Cliente HTTP para /api/chat
      useStudentApi.ts      ← Cliente HTTP para /api/students/list
  store/
    conversation/           ← Zustand store (historial de chat, persiste en localStorage)
  students/page.tsx         ← Ruta /students — solo docentes/admins
  Header.tsx                ← Navegación + botón de login/logout (Clerk)
  layout.tsx                ← ClerkProvider wrapping toda la app
  page.tsx                  ← Chat principal (/ — redirige a LandingPage si no hay sesión)

application/                ← Capa de Casos de Uso (Clean Architecture — sin Next.js ni Supabase)
  command/
    AddMessageHandler.ts    ← Procesa mensajes: Zod → Guardian LLM → Main LLM → Sanitización
  query/
    GetStudentsListHandler.ts ← Inyecta StudentRepository y devuelve lista

infrastructure/             ← Capa de Infraestructura (acceso a BD — solo server-side)
  database/
    supabaseClient.ts       ← Singleton del cliente Supabase (lee SUPABASE_URL + SUPABASE_KEY)
  repositories/
    StudentRepository.ts    ← Consultas a la tabla `students` en Supabase

supabase/
  migration.sql             ← SQL para ejecutar en el dashboard de Supabase
```

---

## Modelo de Seguridad (por capas)

### Capa 1 — Autenticación (Clerk OIDC/OAuth)
- Clerk gestiona login con Google (OAuth 2.0) y sesiones JWT
- `middleware.ts` protege las rutas `/` y `/students` — redirige a login si no hay sesión
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

---

## Convenciones de Código

### Agregar una nueva API Route protegida
Siempre seguir este patrón:
```typescript
export async function POST(req: NextRequest) {
  // 1. Autenticación
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Autorización
  const allowed = await checkServerPermission("write:recurso");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 3. Lógica vía handler de application/
  const handler = new MiHandler();
  const result = await handler.handle(await req.json());
  return NextResponse.json(result);
}
```

### Agregar lógica de negocio
- Si **modifica estado** → crear en `application/command/`
- Si **solo lee** → crear en `application/query/`
- Los handlers **no importan nada de Next.js**

### Variables de entorno
- `GROQ_API_KEY` — solo server-side, nunca al cliente
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — pública (prefijo `NEXT_PUBLIC_`)
- `CLERK_SECRET_KEY` — solo server-side
- `SUPABASE_URL` — solo server-side (NO usar `NEXT_PUBLIC_` aunque el cliente de Supabase lo acepte)
- `SUPABASE_KEY` — publishable/anon key, pero sin `NEXT_PUBLIC_` porque el acceso es solo desde la infraestructura del servidor

> Ver `.env.example` para la lista completa de variables.

---

## Fases del Proyecto Académico

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Hardening: variables de entorno, autenticación Clerk, protección de rutas | ✅ Completada |
| Fase 2 | Autorización RBAC → PBAC, arquitectura limpia | ✅ Completada |
| Fase 3 | Defensa contra Prompt Injection (Dual-LLM + Context Isolation) | ✅ Completada |

---

## Archivos más importantes para modificar

- `application/command/AddMessageHandler.ts` — toda la lógica de seguridad del chat
- `app/api/chat/route.ts` — endpoint del chat
- `app/api/students/list/route.ts` — endpoint de estudiantes con PBAC
- `app/lib/auth.ts` — autorización server-side
- `app/hooks/usePermissions.ts` — autorización client-side
