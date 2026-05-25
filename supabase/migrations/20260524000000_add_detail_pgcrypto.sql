-- =============================================================
-- Parte 4 — Migración 1: campo detail + PGCRYPTO
-- =============================================================

-- Habilitar la extensión pgcrypto (ya viene en Supabase, solo activar)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Agregar columna detail (almacena texto cifrado en base64)
ALTER TABLE students ADD COLUMN IF NOT EXISTS detail TEXT;

-- ---------------------------------------------------------------
-- Función segura para guardar el detail cifrado con AES-256.
-- La clave AES viene del backend (nunca del cliente).
-- SECURITY DEFINER: ejecuta con permisos del owner, no del caller.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_student_detail_encrypted(
    p_id            INT,
    p_plain_detail  TEXT,
    p_aes_key       TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE students
    SET    detail = encode(
                        pgp_sym_encrypt(p_plain_detail, p_aes_key),
                        'base64'
                    )
    WHERE  id = p_id;
END;
$$;

-- ---------------------------------------------------------------
-- Función para descifrar el detail (usada solo server-side).
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_student_detail_decrypted(
    p_id       INT,
    p_aes_key  TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted TEXT;
BEGIN
    SELECT detail INTO v_encrypted FROM students WHERE id = p_id;

    IF v_encrypted IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN pgp_sym_decrypt(decode(v_encrypted, 'base64'), p_aes_key);
END;
$$;
