# Informe Parte 4 — Integración Segura de Supabase

**Materia:** Seguridad Informática  
**Proyecto:** Secure Campus IA  
**Rama:** `feat/Part4-Supabase-Security-Brian`

---

## 1. Integración Segura de Supabase

### Dos clientes con responsabilidades distintas

Se implementaron dos clientes Supabase con niveles de privilegio diferentes:

| Cliente | Archivo | Key usada | Respeta RLS | Uso |
|---|---|---|---|---|
| Service Role | `supabaseClient.ts` | `SUPABASE_SERVICE_ROLE_KEY` | No | Writes privilegiados (updateDetail) |
| Anon + JWT | `supabaseAnonClient.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Lecturas con identidad de usuario |

**Por qué dos clientes:** el principio de mínimo privilegio dicta usar la key menos poderosa posible para cada operación. La lectura de la lista de estudiantes no necesita bypassear RLS; el cliente anon con el JWT del usuario activo es suficiente y más seguro.

### JWT firmado con HS256

El `supabaseAnonClient.ts` firma un JWT HS256 con el `SUPABASE_JWT_SECRET` del proyecto. Este token embebe el `email` y `role` del usuario (extraídos de Clerk), permitiendo que las políticas RLS de PostgreSQL puedan identificar al caller mediante `current_setting('request.jwt.claims')`.

**Flujo:**
```
Clerk autentica al usuario
    → API Route extrae email + role de currentUser()
    → supabaseAnonClient firma JWT con esos claims
    → Supabase valida el JWT y expone los claims a las policies RLS
    → La policy filtra las filas según el claim 'email'
```

---

## 2. Gestión de Cambios con Migraciones

Se agregaron 4 migraciones versionadas en `supabase/migrations/`:

| Archivo | Contenido |
|---|---|
| `20260521000000_create_students.sql` | Tabla inicial + trigger updated_at + datos de ejemplo |
| `20260522000000_initial_students.sql` | RLS habilitado + policy SELECT abierta |
| `20260524000000_add_detail_pgcrypto.sql` | Campo `detail` + funciones PGCRYPTO |
| `20260524000001_sqli_demo_and_fix.sql` | Función vulnerable (demo) + función segura |
| `20260524000002_rls_student_role.sql` | Rol `student` + policy por email |
| `20260524000003_audit_log.sql` | Tabla `audit_log` + trigger de auditoría |

Las migraciones son idempotentes (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`) para poder re-ejecutarlas sin error.

---

## 3. Prevención de SQL Injection

### El vector de ataque

La función `actualizar_descripcion_vulnerable` usa `format()` con `%s` para interpolar directamente el input del usuario en una query SQL dinámica:

```sql
EXECUTE format(
    'UPDATE students SET detail = ''%s'' WHERE id = %s',
    p_nueva_descripcion,   -- ← input del usuario sin escapar
    p_estudiante_id
);
```

**Vector de ataque:** si `p_nueva_descripcion` recibe el valor:
```
texto', active=false WHERE 1=1; --
```
La query resultante sería:
```sql
UPDATE students SET detail = 'texto', active=false WHERE 1=1; --' WHERE id = 5
```
Esto desactiva **todos** los estudiantes de la tabla, sin importar el `id`.

### La corrección

La función `actualizar_descripcion_segura` usa una asignación directa en PL/pgSQL:

```sql
UPDATE students SET detail = p_nueva_descripcion WHERE id = p_estudiante_id;
```

En PL/pgSQL, los parámetros de función (`p_nueva_descripcion`) son tratados como **valores**, nunca como fragmentos SQL. El motor los parametriza internamente. No hay forma de inyectar SQL a través de ellos.

**Regla general:** nunca usar `EXECUTE format(... %s ...)` con input no confiable. Usar `EXECUTE ... USING $1` o queries directas con parámetros.

---

## 4. PGCRYPTO — Cifrado de datos sensibles

### Por qué cifrar el campo `detail`

El campo `detail` puede contener información académica sensible del estudiante. Almacenarlo en texto plano expone esos datos ante:
- Un backup de la base de datos comprometido
- Un acceso directo al dashboard de Supabase por un operador malintencionado
- Un bug en las políticas RLS que filtre datos

### Implementación

Se usa `pgp_sym_encrypt` / `pgp_sym_decrypt` de PGCRYPTO con una clave AES gestionada por el backend:

```sql
-- Cifrado (en set_student_detail_encrypted):
encode(pgp_sym_encrypt(p_plain_detail, p_aes_key), 'base64')

-- Descifrado (en get_student_detail_decrypted):
pgp_sym_decrypt(decode(v_encrypted, 'base64'), p_aes_key)
```

La clave (`SUPABASE_ENCRYPTION_KEY`) vive en las variables de entorno del servidor, nunca en el código fuente ni en el cliente.

**Decisión de diseño:** se cifra en la función SQL (no en TypeScript) para que el dato nunca viaje en plano entre el servidor de aplicación y la base de datos. La operación de cifrado ocurre dentro del proceso de PostgreSQL.

---

## 5. PGAUDIT — Auditoría de accesos

### Limitación de Supabase Cloud

PGAUDIT requiere acceso a `postgresql.conf` para habilitarlo como extensión. Supabase Cloud no permite modificar la configuración del servidor, por lo que PGAUDIT no está disponible en este entorno.

### Solución equivalente: tabla de auditoría con trigger

Se implementó una tabla `audit_log` con un trigger `AFTER INSERT OR UPDATE OR DELETE` sobre la tabla `students`. El trigger registra:

- Operación realizada (INSERT / UPDATE / DELETE)
- Email del usuario (extraído del JWT claim)
- ID de la fila afectada
- Estado anterior (`old_data` en JSON)
- Estado posterior (`new_data` en JSON)
- Timestamp

Esta aproximación cumple el mismo objetivo pedagógico de PGAUDIT: **tener un registro inmutable de quién modificó qué dato y cuándo**.

La tabla `audit_log` tiene RLS habilitado con acceso exclusivo para `service_role`, impidiendo que cualquier cliente pueda modificar o borrar el historial de auditoría.

---

## 6. Capas de Seguridad — Resumen

```
Request del usuario
    │
    ▼
[1] Clerk Middleware — ¿hay sesión válida?
    │ No → 401
    ▼
[2] PBAC (Clerk publicMetadata) — ¿tiene el permiso?
    │ No → 403
    ▼
[3] Validación Zod — ¿el input tiene el tipo y rango correcto?
    │ No → 400 (lanzado por el handler)
    ▼
[4] Query parametrizada / función segura — sin interpolación de strings
    │
    ▼
[5] RLS (PostgreSQL) — ¿el JWT del usuario da acceso a esa fila?
    │ No → resultado vacío o error
    ▼
[6] PGCRYPTO — datos sensibles almacenados cifrados
    │
    ▼
[7] Audit log — registro inmutable de toda modificación
```

---

## 7. Variables de entorno necesarias

Agregar al `.env.local`:

```
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_JWT_SECRET=<jwt_secret>
SUPABASE_ENCRYPTION_KEY=<clave_aes_minimo_32_chars>
```

Todos los valores se obtienen desde el dashboard de Supabase → Project Settings → API.
