-- =============================================================
-- Parte 4 — Migración 5: campo DNI cifrado con PGCRYPTO
-- El DNI es PII (dato personal sensible). Se almacena cifrado
-- con pgp_sym_encrypt (AES-256). La clave viene del servidor,
-- nunca del cliente.
-- =============================================================

-- Extensión ya habilitada en 20260524000000, pero idempotente
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- En Supabase las funciones de pgcrypto viven en el schema extensions
SET search_path TO public, extensions;

ALTER TABLE students ADD COLUMN IF NOT EXISTS dni TEXT;

-- ---------------------------------------------------------------
-- Función para guardar el DNI cifrado
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_student_dni_encrypted(
    p_id       INT,
    p_plain_dni TEXT,
    p_aes_key  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE students
    SET    dni = encode(pgp_sym_encrypt(p_plain_dni, p_aes_key), 'base64')
    WHERE  id  = p_id;
END;
$$;

-- ---------------------------------------------------------------
-- Función para descifrar el DNI (solo server-side)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_student_dni_decrypted(
    p_id      INT,
    p_aes_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted TEXT;
BEGIN
    SELECT dni INTO v_encrypted FROM students WHERE id = p_id;
    IF v_encrypted IS NULL THEN RETURN NULL; END IF;
    RETURN pgp_sym_decrypt(decode(v_encrypted, 'base64'), p_aes_key);
END;
$$;

-- ---------------------------------------------------------------
-- Datos de ejemplo: DNIs argentinos realistas (generación ~2000-2006)
-- Cifrados con la clave demo 'secure-campus-demo-2026'.
-- En producción se reemplaza por SUPABASE_ENCRYPTION_KEY real.
-- ---------------------------------------------------------------
UPDATE students SET dni = encode(pgp_sym_encrypt('43521876', 'secure-campus-demo-2026'), 'base64') WHERE email = 'juan.perez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('44123456', 'secure-campus-demo-2026'), 'base64') WHERE email = 'maria.gomez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('42987654', 'secure-campus-demo-2026'), 'base64') WHERE email = 'carlos.lopez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('45678901', 'secure-campus-demo-2026'), 'base64') WHERE email = 'ana.martinez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('43876543', 'secure-campus-demo-2026'), 'base64') WHERE email = 'luis.fernandez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('44567890', 'secure-campus-demo-2026'), 'base64') WHERE email = 'sofia.ramirez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('45123789', 'secure-campus-demo-2026'), 'base64') WHERE email = 'diego.torres@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('46234567', 'secure-campus-demo-2026'), 'base64') WHERE email = 'valentina.ruiz@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('43456789', 'secure-campus-demo-2026'), 'base64') WHERE email = 'pedro.sanchez@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('44890123', 'secure-campus-demo-2026'), 'base64') WHERE email = 'lucia.herrera@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('42345678', 'secure-campus-demo-2026'), 'base64') WHERE email = 'miguel.castro@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('45901234', 'secure-campus-demo-2026'), 'base64') WHERE email = 'camila.ortiz@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('43678901', 'secure-campus-demo-2026'), 'base64') WHERE email = 'jorge.diaz@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('44456789', 'secure-campus-demo-2026'), 'base64') WHERE email = 'paula.morales@example.com';
UPDATE students SET dni = encode(pgp_sym_encrypt('45234567', 'secure-campus-demo-2026'), 'base64') WHERE email = 'andres.vega@example.com';
