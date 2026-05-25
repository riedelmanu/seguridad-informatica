# Estado del Proyecto — Secure Campus IA

Última actualización: 2026-05-25  
Rama activa: `feat/Part4-Supabase-Security-Brian`

---

## Fases del TPI

| Fase | Descripción | Estado | Rama |
|---|---|---|---|
| Parte 1 | Hardening: env vars, autenticación Clerk, protección de rutas | ✅ Completada | mergeada a main |
| Parte 2 | Autorización RBAC → PBAC, Clean Architecture | ✅ Completada | mergeada a main |
| Parte 3 | Defensa contra Prompt Injection (Dual-LLM + Context Isolation) | ✅ Completada | mergeada a main |
| Parte 4 | Integración segura Supabase, migraciones, SQLi, PGCRYPTO, PGAUDIT | 🔧 En desarrollo | `feat/Part4-Supabase-Security-Brian` |

---

## Parte 4 — Checklist de implementación

### Infraestructura
- [x] `supabaseClient.ts` — cliente service role corregido (usa `SUPABASE_SERVICE_ROLE_KEY`)
- [x] `supabaseAnonClient.ts` — cliente anon con JWT firmado HS256 para RLS
- [x] `.env.example` — documentadas todas las variables necesarias

### Migraciones (en `supabase/migrations/`)
- [x] `20260521000000_create_students.sql` — tabla inicial (pre-existente)
- [x] `20260522000000_initial_students.sql` — RLS básico (pre-existente)
- [x] `20260524000000_add_detail_pgcrypto.sql` — campo detail + funciones PGCRYPTO
- [x] `20260524000001_sqli_demo_and_fix.sql` — función vulnerable (demo) + función segura
- [x] `20260524000002_rls_student_role.sql` — rol student + policy por email
- [x] `20260524000003_audit_log.sql` — tabla audit_log + trigger

### Lógica de negocio
- [x] `StudentRepository.ts` — findAll con cliente anon + updateDetail con función segura + getDetail
- [x] `GetStudentsListHandler.ts` — recibe userContext para RLS
- [x] `UpdateStudentDetailHandler.ts` — nuevo command handler con validación Zod

### API Routes
- [x] `GET /api/students/list` — actualizado para pasar userContext al handler
- [x] `PATCH /api/students/detail` — nueva ruta con permiso `write:student_detail`

### Autorización
- [x] `app/lib/auth.ts` — agregada `getCurrentUserContext()` para extraer email + role de Clerk
- [ ] Clerk dashboard — agregar permiso `write:student_detail` a los roles que correspondan (acción manual)

### UI
- [ ] Página `/students` — agregar editor de detail con condicional por permiso `STUDENT_DETAIL_EDIT`

### Documentación
- [x] `docs/informe-parte4.md` — informe completo de diseño y decisiones de seguridad
- [x] `docs/estado-proyecto.md` — este archivo

---

## Pendiente antes de mergear a main

1. **Clerk dashboard (manual):** agregar permiso `write:student_detail` al rol docente/admin
2. **Supabase dashboard (manual):** ejecutar las 4 migraciones nuevas en SQL Editor
3. **`.env.local` (manual):** agregar las 5 variables nuevas (ver `.env.example`)
4. **UI:** implementar editor de detail en `/students/page.tsx`
5. **Test end-to-end:** verificar que el cifrado/descifrado y el audit log funcionen

---

## Variables de entorno

### Ya configuradas en `.env.local`
| Variable | Descripción |
|---|---|
| `GROQ_API_KEY` | API key de Groq para el LLM |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk público |
| `CLERK_SECRET_KEY` | Clerk secreto |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon key (nombre legacy) |

### Faltan agregar a `.env.local`
| Variable | Dónde obtenerla |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Settings |
| `SUPABASE_ENCRYPTION_KEY` | Generar: mínimo 32 caracteres aleatorios |

---

## Arquitectura de seguridad actual (todas las partes)

```
[Clerk Middleware]         → Protege rutas (401 si no hay sesión)
[PBAC - Clerk]            → Permisos granulares por usuario (403 si falta permiso)
[Zod Validation]          → Valida y limita todo input de usuario
[Guardian LLM]            → Clasifica mensajes como SAFE/MALICIOUS antes del LLM principal
[Context Isolation]       → Delimitador criptográfico separa system prompt del input
[Output Sanitization]     → Verifica que la respuesta no filtre secrets ni el system prompt
[Supabase RLS]            → Las policies de BD filtran filas según el JWT del usuario
[PGCRYPTO]                → Datos sensibles cifrados en reposo con AES
[Audit Log]               → Registro inmutable de toda modificación a la tabla students
```
