<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Guía General para Agentes — Secure Campus IA

Este documento define las reglas y convenciones que **todos los agentes** deben respetar cuando trabajan en este proyecto. Para comportamientos especializados, ver los agentes en `.claude/agents/`.

---

## Contexto del Proyecto

Secure Campus IA es un **proyecto académico de seguridad informática**. Las decisiones de diseño priorizan:
1. **Seguridad demostrable** sobre simplicidad: cada capa de defensa existe por una razón pedagógica
2. **Clean Architecture**: la lógica de negocio en `application/` no depende de Next.js
3. **Explicabilidad**: el código debe ser legible y sus mecanismos de seguridad, comprensibles

---

## Restricciones para Todos los Agentes

### Lo que NUNCA debes hacer

- **Nunca usar verificación de rol directa** (`user.role === 'teacher'`). Usar siempre permisos PBAC.
- **Nunca poner secrets en código fuente**. Solo variables de entorno.
- **Nunca importar código de `next/` desde `application/`**. Esa carpeta es framework-agnostic.
- **Nunca saltear capas de seguridad** (comentar auth checks, etc.) aunque sea "temporalmente".
- **Nunca hacer `git commit --no-verify`** ni force-push a main.
- **Nunca usar `any` en TypeScript** sin una razón documentada.

### Patrones obligatorios

**Toda API Route con datos sensibles:**
```typescript
const { userId } = await auth();            // 401 si no autenticado
if (!userId) return NextResponse.json(..., { status: 401 });

const ok = await checkServerPermission("permiso:recurso");  // 403 si sin permiso
if (!ok) return NextResponse.json(..., { status: 403 });
```

**Todo input de usuario hacia el LLM:**
Debe pasar por el pipeline completo de `AddMessageHandler`: Zod → Guardian → Context Isolation → Output Sanitization.

---

## Skills / Documentos de Referencia

Antes de escribir código, los agentes deben consultar los documentos relevantes:

| Documento | Cuándo consultar |
|---|---|
| `.claude/agents/dev-standards.md` | Al crear archivos, carpetas, imports, enums, nombrar variables |
| `.claude/agents/security-checklist.md` | Al tocar auth, authz, inputs, variables de entorno, datos sensibles |
| `.claude/agents/db-patterns.md` | Al crear migraciones, repositories, o usar clientes Supabase |
| `.claude/agents/security-agent.md` | Al hacer code review de seguridad |
| `.claude/agents/feature-builder.md` | Al agregar nueva funcionalidad end-to-end |
| `.claude/agents/academic-explainer.md` | Al documentar o explicar conceptos de seguridad |

---

## Agentes Disponibles

### `security-agent` (`.claude/agents/security-agent.md`)
**Cuándo usarlo:** Al revisar cualquier cambio que toque rutas API, middleware, auth/authz, el handler de mensajes, o cualquier flujo que procese input de usuarios hacia el LLM.

Especializado en:
- Auditoría PBAC (verificar que no haya role-based checks)
- Revisión del pipeline anti-prompt-injection
- Detección de leakage de secretos
- Validación de códigos HTTP correctos (401 vs 403 vs 400)

---

### `feature-builder` (`.claude/agents/feature-builder.md`)
**Cuándo usarlo:** Al agregar una nueva funcionalidad (nueva ruta API, nuevo caso de uso, nueva página).

Especializado en:
- Crear handlers en `application/command/` o `application/query/`
- Crear API routes siguiendo el patrón auth → authz → handler
- Crear hooks React que consuman las nuevas rutas
- Asegurar que cada nueva feature incluya las capas de seguridad obligatorias

---

### `academic-explainer` (`.claude/agents/academic-explainer.md`)
**Cuándo usarlo:** Al necesitar explicar código o conceptos de seguridad para documentación académica, presentaciones, o comprensión del equipo.

Especializado en:
- Explicar mecanismos de seguridad en lenguaje accesible
- Relacionar implementaciones con conceptos teóricos (OWASP, OAuth 2.0, OIDC, etc.)
- Generar explicaciones paso a paso del flujo de datos
- Identificar qué pregunta académica responde cada decisión de diseño

---

### `dev-standards` (`.claude/agents/dev-standards.md`)
**Cuándo usarlo:** Al crear archivos nuevos, carpetas, definir tipos o enums, nombrar funciones/clases, organizar imports.

Especializado en:
- Convenciones de nomenclatura (carpetas, archivos, handlers, repositories, enums)
- Estructura de directorios y jerarquía de archivos
- Patrones de código TypeScript (API Routes, Handlers, Repositories)
- Gestión de variables de entorno

---

### `security-checklist` (`.claude/agents/security-checklist.md`)
**Cuándo usarlo:** Como checklist de revisión antes de cualquier PR, o al crear código que toca autenticación, autorización, inputs o datos sensibles.

---

### `db-patterns` (`.claude/agents/db-patterns.md`)
**Cuándo usarlo:** Al crear tablas, migraciones, repositories, o al decidir qué cliente Supabase usar.

---

## Convenciones de Nomenclatura

| Contexto | Convención | Ejemplo |
|---|---|---|
| Handlers de command | `NombreAccionHandler` | `AddMessageHandler` |
| Handlers de query | `GetNombreHandler` | `GetStudentsListHandler` |
| Commands | `NombreAccionCommand` | `AddMessageCommand` |
| Queries | `GetNombreQuery` | `GetStudentsListQuery` |
| Hooks React | `useNombre` | `useConversation` |
| Permisos PBAC | `accion:recurso` | `read:students`, `write:messages` |

---

## Ante la Duda

Si no estás seguro de si una operación es segura o sigue las convenciones del proyecto:
1. Leer `CLAUDE.md` para el contexto general
2. Consultar `security-agent` para validar la seguridad
3. Preferir **denegar por defecto** sobre permitir con dudas
