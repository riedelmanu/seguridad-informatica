---
name: db-patterns
description: Patrones de acceso a base de datos en Secure Campus IA. Cuándo usar cada cliente Supabase, cómo escribir migraciones, RLS, cifrado y audit logging. Consultar al crear nuevas tablas, migraciones o repositories.
---

# Patrones de Base de Datos — Secure Campus IA

## Dos Clientes Supabase — Cuándo Usar Cada Uno

### `getSupabaseClient()` — Service Role (bypasea RLS)

```typescript
import { getSupabaseClient } from '@/infrastructure/database/supabaseClient'
```

**Usar para:**
- Writes que necesitan bypasear RLS (audit log, operaciones admin)
- Llamadas a funciones RPC con `SECURITY DEFINER`
- Descifrado de datos sensibles (DNI, detalle)
- Cualquier operación donde el servidor actúa con privilegios totales

**Nunca usar para:**
- Reads que deberían estar limitados por el rol del usuario
- Operaciones iniciadas desde el cliente (browser)

### `getSupabaseAnonClient(email, role)` — Anon con JWT de usuario

```typescript
import { getSupabaseAnonClient } from '@/infrastructure/database/supabaseAnonClient'
```

**Usar para:**
- Reads donde RLS debe aplicarse según el usuario autenticado
- Consultas donde la política "un estudiante solo ve sus propios datos" debe respetarse

**Cómo funciona:**
Genera un JWT firmado con `SUPABASE_JWT_SECRET` que incluye el email y rol del usuario. Supabase lo lee via `current_setting('request.jwt.claims')` en las políticas RLS.

## Estructura de una Migración SQL

```sql
-- Nombre del archivo: YYYYMMDDHHMMSS_descripcion_corta.sql
-- Descripción: qué hace y por qué existe

-- 1. Crear tabla (siempre IF NOT EXISTS para idempotencia)
CREATE TABLE IF NOT EXISTS nombre_tabla (
    id          BIGSERIAL    PRIMARY KEY,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- campos...
);

-- 2. Habilitar RLS siempre
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;

-- 3. Definir políticas
-- Política mínima: solo service_role tiene acceso total
CREATE POLICY "only_service_role"
    ON nombre_tabla FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Política adicional para usuarios si es necesario
CREATE POLICY "users_see_own_data"
    ON nombre_tabla FOR SELECT TO authenticated
    USING (user_email = current_setting('request.jwt.claims', true)::jsonb ->> 'email');

-- 4. Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_nombre_tabla_campo ON nombre_tabla (campo);
```

## Cifrado de Datos Sensibles

El proyecto usa `pgp_sym_encrypt` (pgcrypto) con clave AES-256 para datos sensibles (DNI, detalle de estudiante).

### Patrón para cifrar al escribir

```sql
CREATE OR REPLACE FUNCTION set_campo_encrypted(p_id INT, p_valor TEXT, p_key TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE tabla
    SET campo_cifrado = encode(pgp_sym_encrypt(p_valor, p_key), 'base64')
    WHERE id = p_id;
END;
$$;
```

### Patrón para descifrar al leer

```sql
CREATE OR REPLACE FUNCTION get_campo_decrypted(p_id INT, p_key TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_result TEXT;
BEGIN
    SELECT pgp_sym_decrypt(decode(campo_cifrado, 'base64'), p_key)
    INTO v_result FROM tabla WHERE id = p_id;
    RETURN v_result;
END;
$$;
```

La clave `p_key` viene de `process.env.SUPABASE_ENCRYPTION_KEY` (nunca hardcodeada en código de producción).

## Audit Log de Aplicación (`app_audit_log`)

Registra accesos a datos sensibles desde la aplicación. Diferente del trigger SQL `audit_log` que registra cambios en BD.

### Cuándo escribir en app_audit_log

- Al devolver datos sensibles (DNI, información cifrada)
- En cualquier operación con permiso especial (`read:student_dni`, `read:audit_logs`)
- En acciones administrativas (writes masivos, cambios de configuración)

### Patrón de escritura (no-bloqueante)

```typescript
// Siempre fire-and-forget: un fallo en el audit log nunca interrumpe la respuesta
new AuditLogRepository().create({
    user_id: userId,
    user_email: user?.emailAddresses[0]?.emailAddress ?? 'unknown',
    action: 'READ_DNI',              // acción en SCREAMING_SNAKE_CASE
    resource: `students/${id}/dni`,  // ruta del recurso accedido
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
    metadata: { student_id: id },    // datos extra relevantes
}).catch(err => console.error('Audit log error:', err))
```

### Acciones definidas

| Action | Descripción |
|---|---|
| `READ_DNI` | Lectura del DNI descifrado de un estudiante |
| `LIST_STUDENTS` | Listado de estudiantes (si se loguea) |

Al agregar nuevas acciones: usar `SCREAMING_SNAKE_CASE` y documentar aquí.

## Convenciones de Naming en SQL

| Objeto | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case` plural | `students`, `app_audit_log` |
| Columnas | `snake_case` | `user_email`, `created_at` |
| Funciones | `fn_` o verbo descriptivo | `fn_audit_students`, `get_student_dni_decrypted` |
| Triggers | `trg_` + tabla | `trg_audit_students` |
| Políticas RLS | descripción en snake_case | `only_service_role_reads_audit` |
| Índices | `idx_` + tabla + campo | `idx_app_audit_log_user_id` |

## Errores Comunes a Evitar

```typescript
// ❌ Concatenar strings en SQL (SQLi)
const { data } = await supabase.rpc(`SELECT * FROM students WHERE name = '${input}'`)

// ✅ Usar parámetros
const { data } = await supabase.from('students').select('*').eq('name', input)

// ❌ Usar service role para reads de usuario
const supabase = getSupabaseClient()  // bypasea RLS
const { data } = await supabase.from('students').select('*').eq('email', userEmail)

// ✅ Usar cliente anon para reads con RLS
const supabase = getSupabaseAnonClient(user.email, user.role)
const { data } = await supabase.from('students').select('*')

// ❌ Fallar silenciosamente en errores de DB
const { data, error } = await supabase.from('tabla').select('*')
return data  // si error != null, data es null y crashea después

// ✅ Manejar errores explícitamente
const { data, error } = await supabase.from('tabla').select('*')
if (error) throw new Error(`Error al consultar tabla: ${error.message}`)
return data as TipoEsperado[]
```
