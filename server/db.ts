/**
 * AsisTrack - Database Connection & Abstraction Layer
 * Supports native PostgreSQL (e.g. Render / Cloud / Local)
 * and automatic persistent local relational storage with identical schemas.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  password_hash: string;
  rol: 'administrador' | 'docente';
  nombre_completo: string;
  creado_en: string;
}

export interface Curso {
  id_curso: number;
  anio: string;
  division: string;
  turno: 'Mañana' | 'Tarde' | 'Vespertino';
}

export interface Estudiante {
  id_estudiante: number;
  dni: string;
  apellido: string;
  nombre: string;
  id_curso: number;
  estado: 'activo' | 'inactivo';
  creado_en: string;
}

export interface Asistencia {
  id_asistencia: number;
  id_estudiante: number;
  fecha: string; // YYYY-MM-DD
  jornada: 'Mañana' | 'Tarde' | 'Jornada Completa';
  estado: 'P' | 'A' | 'T' | 'AJ';
  observacion: string | null;
  id_usuario: number;
  creado_en: string;
}

export interface DBState {
  usuarios: Usuario[];
  cursos: Curso[];
  estudiantes: Estudiante[];
  asistencias: Asistencia[];
}

let pgPool: pg.Pool | null = null;
const isPostgresConfigured = Boolean(process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGDATABASE));

// Local database file path
const DATA_DIR = path.resolve(process.cwd(), '.data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'asistrack_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Generate default hashed passwords
const salt = bcrypt.genSaltSync(10);
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('admin123', salt);
const DOCENTE_PASSWORD_HASH = bcrypt.hashSync('docente123', salt);

function getInitialData(): DBState {
  return {
    usuarios: [
      {
        id_usuario: 1,
        nombre_usuario: 'admin',
        password_hash: DEFAULT_PASSWORD_HASH,
        rol: 'administrador',
        nombre_completo: 'Prof. Martín Gómez (Director)',
        creado_en: new Date().toISOString()
      },
      {
        id_usuario: 2,
        nombre_usuario: 'docente',
        password_hash: DOCENTE_PASSWORD_HASH,
        rol: 'docente',
        nombre_completo: 'Prof. Laura Fernández',
        creado_en: new Date().toISOString()
      }
    ],
    cursos: [
      { id_curso: 1, anio: '1.º', division: 'A', turno: 'Mañana' },
      { id_curso: 2, anio: '1.º', division: 'B', turno: 'Mañana' },
      { id_curso: 3, anio: '1.º', division: 'C', turno: 'Tarde' },
      { id_curso: 4, anio: '2.º', division: 'A', turno: 'Mañana' },
      { id_curso: 5, anio: '2.º', division: 'B', turno: 'Tarde' },
      { id_curso: 6, anio: '2.º', division: 'C', turno: 'Tarde' },
      { id_curso: 7, anio: '3.º', division: 'A', turno: 'Mañana' },
      { id_curso: 8, anio: '3.º', division: 'B', turno: 'Mañana' },
      { id_curso: 9, anio: '3.º', division: 'C', turno: 'Vespertino' }
    ],
    estudiantes: [
      // 1.º A
      { id_estudiante: 1, dni: '48102301', apellido: 'Álvarez', nombre: 'Mateo', id_curso: 1, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 2, dni: '48102302', apellido: 'Benítez', nombre: 'Sofía', id_curso: 1, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 3, dni: '48102303', apellido: 'Castro', nombre: 'Joaquín', id_curso: 1, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 4, dni: '48102304', apellido: 'Díaz', nombre: 'Valentina', id_curso: 1, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 5, dni: '48102305', apellido: 'Espíndola', nombre: 'Lucas', id_curso: 1, estado: 'activo', creado_en: new Date().toISOString() },
      
      // 1.º B
      { id_estudiante: 6, dni: '48201401', apellido: 'Ferreira', nombre: 'Camila', id_curso: 2, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 7, dni: '48201402', apellido: 'García', nombre: 'Thiago', id_curso: 2, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 8, dni: '48201403', apellido: 'Herrera', nombre: 'Mia', id_curso: 2, estado: 'activo', creado_en: new Date().toISOString() },
      
      // 2.º A
      { id_estudiante: 9, dni: '47309110', apellido: 'Ibarra', nombre: 'Agustín', id_curso: 4, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 10, dni: '47309111', apellido: 'Juárez', nombre: 'Martina', id_curso: 4, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 11, dni: '47309112', apellido: 'López', nombre: 'Facundo', id_curso: 4, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 12, dni: '47309113', apellido: 'Morales', nombre: 'Zoe', id_curso: 4, estado: 'activo', creado_en: new Date().toISOString() },

      // 3.º A
      { id_estudiante: 13, dni: '46412890', apellido: 'Navarro', nombre: 'Santiago', id_curso: 7, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 14, dni: '46412891', apellido: 'Ortiz', nombre: 'Emilia', id_curso: 7, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 15, dni: '46412892', apellido: 'Pérez', nombre: 'Nicolás', id_curso: 7, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 16, dni: '46412893', apellido: 'Quinteros', nombre: 'Lucía', id_curso: 7, estado: 'inactivo', creado_en: new Date().toISOString() },
      { id_estudiante: 17, dni: '46412894', apellido: 'Pérez', nombre: 'José', id_curso: 1, estado: 'activo', creado_en: new Date().toISOString() },
      { id_estudiante: 18, dni: '46412895', apellido: 'Gómez', nombre: 'María', id_curso: 4, estado: 'activo', creado_en: new Date().toISOString() }
    ],
    asistencias: [
      // Pre-seed some representative attendances for statistics and demonstration
      { id_asistencia: 1, id_estudiante: 1, fecha: '2026-11-04', jornada: 'Mañana', estado: 'P', observacion: 'Presente a tiempo', id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 2, id_estudiante: 2, fecha: '2026-11-04', jornada: 'Mañana', estado: 'P', observacion: null, id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 3, id_estudiante: 3, fecha: '2026-11-04', jornada: 'Mañana', estado: 'T', observacion: 'Ingreso 15 min tarde', id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 4, id_estudiante: 4, fecha: '2026-11-04', jornada: 'Mañana', estado: 'A', observacion: 'Inasistencia sin aviso', id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 5, id_estudiante: 5, fecha: '2026-11-04', jornada: 'Mañana', estado: 'AJ', observacion: 'Certificado médico presentado', id_usuario: 2, creado_en: new Date().toISOString() },

      { id_asistencia: 6, id_estudiante: 1, fecha: '2026-11-05', jornada: 'Mañana', estado: 'P', observacion: null, id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 7, id_estudiante: 2, fecha: '2026-11-05', jornada: 'Mañana', estado: 'P', observacion: null, id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 8, id_estudiante: 3, fecha: '2026-11-05', jornada: 'Mañana', estado: 'P', observacion: null, id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 9, id_estudiante: 4, fecha: '2026-11-05', jornada: 'Mañana', estado: 'A', observacion: 'Segunda inasistencia consecutiva', id_usuario: 2, creado_en: new Date().toISOString() },
      { id_asistencia: 10, id_estudiante: 5, fecha: '2026-11-05', jornada: 'Mañana', estado: 'P', observacion: 'Reincorporado con certificado', id_usuario: 2, creado_en: new Date().toISOString() }
    ]
  };
}

let localCache: DBState | null = null;

export function loadLocalDB(): DBState {
  if (localCache) return localCache;
  ensureDataDir();
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initial = getInitialData();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    localCache = initial;
    return initial;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    localCache = JSON.parse(raw);
    return localCache!;
  } catch (err) {
    console.error('Error reading local DB, regenerating default:', err);
    const initial = getInitialData();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    localCache = initial;
    return initial;
  }
}

export function saveLocalDB(data: DBState) {
  localCache = data;
  ensureDataDir();
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Initializes the database (PostgreSQL if configured, or local persistent store)
 */
export async function initDB() {
  if (isPostgresConfigured) {
    try {
      console.log('Connecting to PostgreSQL database...');
      const connectionString = process.env.DATABASE_URL;
      const config: pg.PoolConfig = connectionString
        ? {
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
          }
        : {
            host: process.env.PGHOST || 'localhost',
            port: Number(process.env.PGPORT || 5432),
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || '',
            database: process.env.PGDATABASE || 'asistrack',
            ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
          };

      pgPool = new Pool(config);

      // Run SQL DDL Script
      const sqlFile = path.resolve(process.cwd(), 'database.sql');
      if (fs.existsSync(sqlFile)) {
        const ddl = fs.readFileSync(sqlFile, 'utf-8');
        await pgPool.query(ddl);
        console.log('PostgreSQL tables & seeds initialized successfully from database.sql.');
      }
    } catch (err) {
      console.warn('PostgreSQL connection attempt failed. Falling back to local persistent storage:', err);
      pgPool = null;
    }
  }

  if (!pgPool) {
    loadLocalDB();
    console.log('Using local persistent relational store (.data/asistrack_db.json)');
  }
}

/**
 * Database Query Helper
 */
export async function dbQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (pgPool) {
    const res = await pgPool.query(sql, params);
    return res.rows;
  }
  throw new Error('Postgres not active for raw SQL');
}

export { pgPool };
