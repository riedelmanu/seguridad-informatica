-- =============================================================
-- Parte 4 — Migración 4: Tabla de auditoría (alternativa a PGAUDIT)
-- PGAUDIT no está disponible en Supabase Cloud. Se implementa un
-- mecanismo equivalente con tabla de auditoría + trigger.
-- =============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    table_name  TEXT         NOT NULL,
    operation   TEXT         NOT NULL,  -- INSERT | UPDATE | DELETE
    user_email  TEXT,                   -- extraído del JWT claim
    row_id      INT,
    old_data    JSONB,
    new_data    JSONB,
    changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Solo el service_role puede leer el audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only_service_role_reads_audit"
    ON audit_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------
-- Función trigger: inserta una fila en audit_log ante cualquier
-- INSERT, UPDATE o DELETE en la tabla students.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_students()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email TEXT;
BEGIN
    -- Intentar leer el email del JWT; silencioso si no hay sesión
    BEGIN
        v_email := current_setting('request.jwt.claims', true)::jsonb ->> 'email';
    EXCEPTION WHEN OTHERS THEN
        v_email := NULL;
    END;

    INSERT INTO audit_log (table_name, operation, user_email, row_id, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_email,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_students ON students;
CREATE TRIGGER trg_audit_students
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_students();
