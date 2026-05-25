-- =============================================================
-- Parte 4 — Migración 3: RLS con rol student
-- =============================================================

-- Asegurar que RLS esté habilitado (idempotente)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- Crear rol 'student' en la base de datos.
-- Este rol representa a usuarios autenticados con perfil de alumno.
-- ---------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'student') THEN
        CREATE ROLE student;
    END IF;
END;
$$;

GRANT USAGE  ON SCHEMA public   TO student;
GRANT SELECT ON TABLE  students TO student;

-- ---------------------------------------------------------------
-- Política de RLS para el rol student:
-- Un estudiante solo puede ver SU PROPIO registro.
-- El email del token JWT (seteado en supabaseAnonClient.ts)
-- se compara con el campo email de la tabla.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "student_sees_own_row" ON students;
CREATE POLICY "student_sees_own_row"
    ON students
    FOR SELECT
    TO student
    USING (
        email = (
            current_setting('request.jwt.claims', true)::jsonb ->> 'email'
        )
    );

-- ---------------------------------------------------------------
-- Política abierta para el service_role (uso interno del backend).
-- Sin esta policy, el service role también quedaría bloqueado por RLS.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_full_access" ON students;
CREATE POLICY "service_role_full_access"
    ON students
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
