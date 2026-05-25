-- =============================================================
-- Migración: Tabla de auditoría de aplicación (accesos a datos sensibles)
-- Registra quién accedió a qué recurso, cuándo y desde dónde.
-- Complementa el trigger de audit_log (que registra cambios en BD).
-- =============================================================

CREATE TABLE IF NOT EXISTS app_audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_id     TEXT         NOT NULL,   -- Clerk user ID
    user_email  TEXT         NOT NULL,
    action      TEXT         NOT NULL,   -- 'READ_DNI' | 'LIST_STUDENTS' | etc.
    resource    TEXT         NOT NULL,   -- 'students/42/dni'
    ip_address  TEXT,
    user_agent  TEXT,
    metadata    JSONB
);

-- Solo el service_role puede leer y escribir app_audit_log
ALTER TABLE app_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only_service_role_app_audit"
    ON app_audit_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_app_audit_log_user_id   ON app_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_app_audit_log_timestamp ON app_audit_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_audit_log_action    ON app_audit_log (action);
