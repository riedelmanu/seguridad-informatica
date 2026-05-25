-- =============================================================
-- Parte 4 — Migración 2: Demo SQLi + función segura
-- =============================================================

-- ---------------------------------------------------------------
-- FUNCIÓN VULNERABLE — solo para demostración académica del ataque.
-- Vector: p_nueva_descripcion = "X', active=false WHERE 1=1; --"
-- NUNCA llamar desde producción.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_descripcion_vulnerable(
    p_estudiante_id     INT,
    p_nueva_descripcion TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- format() con %s NO escapa el valor: permite inyección SQL.
    EXECUTE format(
        'UPDATE students SET detail = ''%s'' WHERE id = %s',
        p_nueva_descripcion,
        p_estudiante_id
    );
END;
$$;

-- ---------------------------------------------------------------
-- FUNCIÓN SEGURA — reemplaza a la vulnerable.
-- Usa query parametrizada (UPDATE directo con variables PL/pgSQL).
-- PL/pgSQL trata los parámetros como valores, nunca como SQL.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_descripcion_segura(
    p_estudiante_id     INT,
    p_nueva_descripcion TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE students
    SET    detail = p_nueva_descripcion
    WHERE  id     = p_estudiante_id;
END;
$$;
