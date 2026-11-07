-- ==============================================================
-- ASISTRACK - SISTEMA DE GESTIÓN DE ASISTENCIA ESCOLAR
-- Script de Creación de Base de Datos y Datos Iniciales (PostgreSQL)
-- Trabajo Práctico Final Integrador - Programación III
-- ==============================================================
-- Habilitar extensión unaccent de PostgreSQL para búsquedas sin acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'docente')),
    nombre_completo VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: cursos
CREATE TABLE IF NOT EXISTS cursos (
    id_curso SERIAL PRIMARY KEY,
    anio VARCHAR(10) NOT NULL,        -- '1.º', '2.º', '3.º', etc.
    division VARCHAR(10) NOT NULL,    -- 'A', 'B', 'C', etc.
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('Mañana', 'Tarde', 'Vespertino')),
    CONSTRAINT uq_curso UNIQUE (anio, division, turno)
);

-- 3. TABLA: estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id_estudiante SERIAL PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    apellido VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    id_curso INTEGER NOT NULL REFERENCES cursos(id_curso) ON DELETE RESTRICT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: asistencias
-- Restricción UNIQUE en (id_estudiante, fecha, jornada) para evitar duplicación
CREATE TABLE IF NOT EXISTS asistencias (
    id_asistencia SERIAL PRIMARY KEY,
    id_estudiante INTEGER NOT NULL REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    jornada VARCHAR(20) NOT NULL CHECK (jornada IN ('Mañana', 'Tarde', 'Jornada Completa')),
    estado VARCHAR(5) NOT NULL CHECK (estado IN ('P', 'A', 'T', 'AJ')),
    observacion TEXT,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asistencia_estudiante_fecha_jornada UNIQUE (id_estudiante, fecha, jornada)
);

-- ÍNDICES PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_estudiante ON asistencias(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON estudiantes(id_curso);
CREATE INDEX IF NOT EXISTS idx_estudiantes_dni ON estudiantes(dni);

-- ==============================================================
-- DATOS INICIALES (SEEDS)
-- ==============================================================

-- Usuarios por defecto (Contraseñas con bcrypt: admin123 y docente123)
-- Hash para 'admin123': $2a$10$wT8KskYV/yO3YF0e6fQjtuE5Lz0c.bQxMvL6zO5wU0U7mO5Z5vQey o generado dinámicamente
INSERT INTO usuarios (nombre_usuario, password_hash, rol, nombre_completo)
VALUES 
('admin', '$2a$10$76gqZ5N4HwG0y62MZZJ/d.wLhVdJSm75mJ1k3R9P7yUfT7w4lZgXW', 'administrador', 'Prof. Martín Gómez (Director)'),
('docente', '$2a$10$76gqZ5N4HwG0y62MZZJ/d.wLhVdJSm75mJ1k3R9P7yUfT7w4lZgXW', 'docente', 'Prof. Laura Fernández')
ON CONFLICT (nombre_usuario) DO NOTHING;

-- Cursos Iniciales obligatorios (1.º, 2.º y 3.º con divisiones A, B y C)
INSERT INTO cursos (anio, division, turno) VALUES
('1.º', 'A', 'Mañana'),
('1.º', 'B', 'Mañana'),
('1.º', 'C', 'Tarde'),
('2.º', 'A', 'Mañana'),
('2.º', 'B', 'Tarde'),
('2.º', 'C', 'Tarde'),
('3.º', 'A', 'Mañana'),
('3.º', 'B', 'Mañana'),
('3.º', 'C', 'Vespertino')
ON CONFLICT (anio, division, turno) DO NOTHING;
