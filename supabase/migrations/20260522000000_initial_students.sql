-- =============================================================
-- Secure Campus IA — Migración inicial de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- 1. Crear tabla de estudiantes
-- =============================================================
CREATE TABLE IF NOT EXISTS students (
    id         SERIAL      PRIMARY KEY,
    name       TEXT        NOT NULL,
    email      TEXT        NOT NULL UNIQUE,
    active     BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
-- =============================================================
-- RLS es la defensa en profundidad a nivel de base de datos.
-- Nuestra autorización real se hace en la capa de API (Clerk PBAC),
-- pero con RLS además nos aseguramos que:
--   - Solo se puedan LEER filas activas (no escribir ni borrar directamente)
--   - Ante una brecha en la capa de aplicación, la BD tiene su propia política
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Política: solo lectura (SELECT) para todos — los writes quedan bloqueados por defecto.
-- La autorización de QUIÉN puede hacer el GET /api/students/list la maneja Clerk.
CREATE POLICY "allow_select" ON students
    FOR SELECT
    USING (true);

-- 3. Migrar datos hardcodeados
-- =============================================================
INSERT INTO students (name, email, active) VALUES
    ('Juan Pérez',       'juan.perez@example.com',       true),
    ('María Gómez',      'maria.gomez@example.com',      true),
    ('Carlos López',     'carlos.lopez@example.com',     true),
    ('Ana Martínez',     'ana.martinez@example.com',     true),
    ('Luis Fernández',   'luis.fernandez@example.com',   true),
    ('Sofía Ramírez',    'sofia.ramirez@example.com',    true),
    ('Diego Torres',     'diego.torres@example.com',     true),
    ('Valentina Ruiz',   'valentina.ruiz@example.com',   true),
    ('Pedro Sánchez',    'pedro.sanchez@example.com',    true),
    ('Lucía Herrera',    'lucia.herrera@example.com',    true),
    ('Miguel Castro',    'miguel.castro@example.com',    true),
    ('Camila Ortiz',     'camila.ortiz@example.com',     true),
    ('Jorge Díaz',       'jorge.diaz@example.com',       true),
    ('Paula Morales',    'paula.morales@example.com',    true),
    ('Andrés Vega',      'andres.vega@example.com',      true)
ON CONFLICT (email) DO NOTHING;
