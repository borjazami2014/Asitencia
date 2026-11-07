import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { pgPool, loadLocalDB } from './db.ts';

import authRoutes from './routes/auth.routes.ts';
import cursosRoutes from './routes/cursos.routes.ts';
import estudiantesRoutes from './routes/estudiantes.routes.ts';
import asistenciasRoutes from './routes/asistencias.routes.ts';
import historialRoutes from './routes/historial.routes.ts';
import estadisticasRoutes from './routes/estadisticas.routes.ts';
import informesRoutes from './routes/informes.routes.ts';

export function createExpressApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Status & Health
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      sistema: 'AsisTrack - Sistema de Gestión de Asistencia Escolar',
      baseDeDatos: pgPool ? 'PostgreSQL (Activo / Conectado)' : 'Almacenamiento Relacional Persistente Local',
      timestamp: new Date().toISOString()
    });
  });

  // System Database Info
  app.get('/api/info', (_req, res) => {
    if (pgPool) {
      res.json({
        motor: 'PostgreSQL',
        estado: 'Conectado',
        servidor: 'Render / Cloud PostgreSQL'
      });
    } else {
      const db = loadLocalDB();
      res.json({
        motor: 'PostgreSQL Relational Local Store',
        estado: 'Activo',
        archivo: '.data/asistrack_db.json',
        totales: {
          usuarios: db.usuarios.length,
          cursos: db.cursos.length,
          estudiantes: db.estudiantes.length,
          asistencias: db.asistencias.length
        }
      });
    }
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/cursos', cursosRoutes);
  app.use('/api/estudiantes', estudiantesRoutes);
  app.use('/api/asistencias', asistenciasRoutes);
  app.use('/api/historial', historialRoutes);
  app.use('/api/estadisticas', estadisticasRoutes);
  app.use('/api/informes', informesRoutes);

  // Global 404 for unmatched /api routes
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.' });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({
      error: 'Ocurrió un error inesperado en el servidor.',
      detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
}
