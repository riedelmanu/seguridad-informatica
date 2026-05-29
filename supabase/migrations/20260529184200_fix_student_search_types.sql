-- =============================================================
-- Migración: Corregir tipos de retorno de la búsqueda segura
-- =============================================================

SET search_path TO public, extensions;

-- Eliminar la función anterior para evitar conflictos de tipo de retorno
DROP FUNCTION IF EXISTS buscar_estudiantes_segura(TEXT);

-- Recrear la función con tipos de datos mapeados a la tabla (%TYPE)
CREATE OR REPLACE FUNCTION buscar_estudiantes_segura(p_criterio TEXT)
RETURNS TABLE(
    id students.id%TYPE,
    name students.name%TYPE,
    email students.email%TYPE,
    active students.active%TYPE
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
