-- =============================================================
-- Parte 4 — Migración 6: Búsqueda segura de estudiantes
-- =============================================================

SET search_path TO public, extensions;

-- ---------------------------------------------------------------
-- Función para buscar estudiantes de forma segura
-- Usa consultas parametrizadas puras de PL/pgSQL
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION buscar_estudiantes_segura(p_criterio TEXT)
RETURNS TABLE(
    id INT,
    name VARCHAR,
    email VARCHAR,
    active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.email, s.active
    FROM students s
    WHERE s.active = true 
      AND (s.name ILIKE '%' || p_criterio || '%' OR s.email ILIKE '%' || p_criterio || '%')
    ORDER BY s.id ASC;
END;
$$;
