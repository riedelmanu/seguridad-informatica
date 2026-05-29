---
name: security-checklist
description: Checklist de seguridad para Secure Campus IA. Revisar antes de cada PR o cuando se toque código de autenticación, autorización, inputs de usuario, variables de entorno o acceso a base de datos.
---

# Checklist de Seguridad — Secure Campus IA

## Capa 1 — Autenticación (Clerk)

- [ ] Toda API Route llama `await auth()` y verifica `userId`
- [ ] Si `!userId` → responde `{ error: 'No autorizado.' }` con **status 401**
- [ ] El middleware (`proxy.ts`) protege las rutas de la aplicación (Next.js 16 usa proxy.ts)
- [ ] Las rutas públicas (landing, sign-in) están excluidas correctamente del matcher
- [ ] Nunca se confía en headers de usuario para determinar identidad (`x-user-id` es falsificable)

## Capa 2 — Autorización PBAC

- [ ] Toda API Route que accede a datos sensibles llama `checkServerPermission('accion:recurso')`
- [ ] Si `!hasPermission` → responde con **status 403** (no 401, no 404)
- [ ] Los permisos viven en `publicMetadata.permissions[]` del usuario en Clerk
- [ ] **Nunca** se verifica rol directo (`user.role === 'teacher'`)
- [ ] Los componentes client-side usan `usePermissions()` solo para UI (nunca como única barrera)
- [ ] La barrera real es siempre server-side en la API Route

### Permisos definidos en el sistema

| Permiso | Descripción |
|---|---|
| `read:students` | Ver listado de estudiantes |
| `read:student_dni` | Ver DNI descifrado de un estudiante |
| `read:audit_logs` | Ver el audit log de la aplicación |

## Capa 3 — Anti Prompt Injection (AddMessageHandler)

El pipeline completo debe ejecutarse en este orden para todo input que vaya al LLM:

1. **Validación Zod**: `message` min 1, max 2000 caracteres
2. **Guardian LLM**: modelo separado clasifica input como `SAFE` o `MALICIOUS`
   - Si hay error en el Guardian → **bloquear (fail-safe)**, no permitir
   - Si responde `MALICIOUS` → rechazar con mensaje educativo
3. **Context Isolation**: delimitador criptográfico aleatorio (`===BOUNDARY_<8 bytes hex>===`)
   - El input del usuario va DESPUÉS del delimitador
   - El system prompt va ANTES del delimitador
   - Nadie puede "escapar" del contexto del usuario al system prompt
4. **Output Sanitization**: verificar que la respuesta no contenga:
   - La `GROQ_API_KEY`
   - El system prompt textual
   - El delimitador criptográfico

**Nunca saltar pasos del pipeline** aunque sea "para pruebas". Modificar `AddMessageHandler.ts` con extremo cuidado.

## Capa 4 — Restricción de Dominio

- [ ] El system prompt instruye al LLM a responder SOLO sobre temas educativos
- [ ] El LLM rechaza y redirige consultas fuera del dominio

## Variables de Entorno y Secretos

- [ ] `GROQ_API_KEY` nunca tiene prefijo `NEXT_PUBLIC_`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca tiene prefijo `NEXT_PUBLIC_`
- [ ] `CLERK_SECRET_KEY` nunca tiene prefijo `NEXT_PUBLIC_`
- [ ] `SUPABASE_ENCRYPTION_KEY` nunca tiene prefijo `NEXT_PUBLIC_`
- [ ] `getSupabaseClient()` usa `SUPABASE_SERVICE_ROLE_KEY` sin fallback a anon key
- [ ] `.env.local` está en `.gitignore`
- [ ] No hay secretos hardcodeados en el código fuente (strings literales de API keys, passwords)
- [ ] Las migraciones SQL con datos de ejemplo usan claves de demo claramente marcadas

## Base de Datos (Supabase)

- [ ] RLS habilitado en todas las tablas con datos de usuarios
- [ ] La tabla `app_audit_log` y `audit_log` solo son accesibles por `service_role`
- [ ] El cliente anon (`getSupabaseAnonClient`) se usa para reads que deben respetar RLS
- [ ] El cliente service role (`getSupabaseClient`) solo se usa server-side
- [ ] Las funciones SQL con datos sensibles son `SECURITY DEFINER` y validan ownership
- [ ] Los parámetros en funciones SQL nunca se concatenan como strings (usar parámetros PL/pgSQL)

## Audit Log

- [ ] Toda lectura de dato sensible (`READ_DNI`, etc.) genera una entrada en `app_audit_log`
- [ ] El audit log es **no-bloqueante**: un fallo al escribirlo nunca interrumpe la respuesta al usuario
- [ ] Los campos mínimos a loguear: `user_id`, `user_email`, `action`, `resource`, `ip_address`
- [ ] El endpoint `/api/audit` requiere permiso `read:audit_logs`

## Inputs y Outputs

- [ ] Todo input de usuario se valida con Zod antes de procesar
- [ ] Los IDs numéricos en rutas dinámicas se validan con `parseInt + isNaN`
- [ ] Las respuestas de error no exponen stack traces ni mensajes internos
- [ ] Los headers de IP (`x-forwarded-for`, `x-real-ip`) se loguean pero no se confían para autenticación

## HTTP Headers de Seguridad (next.config.ts)

Agregar cuando el proyecto vaya a producción real:

```typescript
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ],
}]
```

## Preguntas de Revisión Rápida

Antes de aprobar cualquier cambio que toque seguridad, responder:

1. ¿Puede un usuario no autenticado acceder a este endpoint? → debe retornar 401
2. ¿Puede un usuario sin permiso acceder a este dato? → debe retornar 403
3. ¿Pasa este input por el pipeline completo de AddMessageHandler? → Zod + Guardian + Isolation + Sanitization
4. ¿Se escapa algún secreto al bundle del cliente? → revisar prefijos NEXT_PUBLIC_
5. ¿Se loguea el acceso a datos sensibles en app_audit_log? → debe ser sí para DNI y datos cifrados
6. ¿El fallback de error es seguro? → en caso de duda, denegar (fail-safe)
