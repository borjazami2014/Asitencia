import { Router, Response } from 'express';
import { pgPool, loadLocalDB, saveLocalDB, Asistencia } from '../db.ts';
import { authenticateToken, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// GET /api/asistencias - Obtener lista de asistencias filtradas por curso, fecha, jornada
router.get('/', authenticateToken, async (req, res: Response) => {
  try {
    const { id_curso, fecha, jornada, id_estudiante, mes, anio_escolar } = req.query;

    if (pgPool) {
      let query = `
        SELECT a.*, 
               e.dni, e.apellido, e.nombre, e.id_curso,
               c.anio, c.division, c.turno,
               u.nombre_completo AS registrado_por, u.nombre_usuario AS usuario_registro
        FROM asistencias a
        INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params: any[] = [];

      if (id_curso) {
        params.push(Number(id_curso));
        query += ` AND e.id_curso = $${params.length}`;
      }

      if (fecha) {
        params.push(fecha);
        query += ` AND a.fecha = $${params.length}`;
      }

      if (jornada) {
        params.push(jornada);
        query += ` AND a.jornada = $${params.length}`;
      }

      if (id_estudiante) {
        params.push(Number(id_estudiante));
        query += ` AND a.id_estudiante = $${params.length}`;
      }

      if (mes) {
        params.push(Number(mes));
        query += ` AND EXTRACT(MONTH FROM a.fecha) = $${params.length}`;
      }

      if (anio_escolar) {
        params.push(Number(anio_escolar));
        query += ` AND EXTRACT(YEAR FROM a.fecha) = $${params.length}`;
      }

      query += ` ORDER BY a.fecha DESC, e.apellido ASC, e.nombre ASC`;
      const result = await pgPool.query(query, params);
      return res.json(result.rows);
    } else {
      const db = loadLocalDB();
      let list = db.asistencias.map((a) => {
        const est = db.estudiantes.find((e) => e.id_estudiante === a.id_estudiante);
        const cur = est ? db.cursos.find((c) => c.id_curso === est.id_curso) : undefined;
        const usr = db.usuarios.find((u) => u.id_usuario === a.id_usuario);
        return {
          ...a,
          dni: est?.dni || '',
          apellido: est?.apellido || '',
          nombre: est?.nombre || '',
          id_curso: est?.id_curso || 0,
          anio: cur?.anio || '',
          division: cur?.division || '',
          turno: cur?.turno || '',
          registrado_por: usr?.nombre_completo || 'Sistema',
          usuario_registro: usr?.nombre_usuario || 'admin'
        };
      });

      if (id_curso) {
        list = list.filter((a) => a.id_curso === Number(id_curso));
      }

      if (fecha) {
        list = list.filter((a) => a.fecha === String(fecha));
      }

      if (jornada) {
        list = list.filter((a) => a.jornada === String(jornada));
      }

      if (id_estudiante) {
        list = list.filter((a) => a.id_estudiante === Number(id_estudiante));
      }

      if (mes) {
        list = list.filter((a) => {
          const d = new Date(a.fecha);
          return d.getUTCMonth() + 1 === Number(mes);
        });
      }

      if (anio_escolar) {
        list = list.filter((a) => {
          const d = new Date(a.fecha);
          return d.getUTCFullYear() === Number(anio_escolar);
        });
      }

      list.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.apellido.localeCompare(b.apellido));
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error al obtener asistencias:', err);
    return res.status(500).json({ error: 'Error al consultar las asistencias.' });
  }
});

// POST /api/asistencias/guardar-lote - Registro individual o masivo de asistencia para un curso
// Utiliza la restricción UNIQUE (id_estudiante, fecha, jornada) para evitar duplicados
router.post('/guardar-lote', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fecha, jornada, registros } = req.body;
    // registros = Array<{ id_estudiante: number, estado: 'P'|'A'|'T'|'AJ', observacion?: string }>
    const id_usuario = req.user!.id_usuario;

    if (!fecha || !jornada || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ error: 'Fecha, jornada y lista de asistencias son requeridos.' });
    }

    const jornadasValidas = ['Mañana', 'Tarde', 'Jornada Completa'];
    if (!jornadasValidas.includes(jornada)) {
      return res.status(400).json({ error: 'Jornada inválida.' });
    }

    const estadosValidos = ['P', 'A', 'T', 'AJ'];
    for (const r of registros) {
      if (!r.id_estudiante || !estadosValidos.includes(r.estado)) {
        return res.status(400).json({
          error: `Registro con estudiante ID ${r.id_estudiante} contiene un estado inválido (${r.estado}). Debe ser P, A, T o AJ.`
        });
      }
    }

    if (pgPool) {
      // Begin transaction in PostgreSQL
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        for (const reg of registros) {
          const obs = reg.observacion ? String(reg.observacion).trim() : null;
          // UPSERT based on UNIQUE constraint (id_estudiante, fecha, jornada)
          const query = `
            INSERT INTO asistencias (id_estudiante, fecha, jornada, estado, observacion, id_usuario)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id_estudiante, fecha, jornada)
            DO UPDATE SET 
              estado = EXCLUDED.estado,
              observacion = EXCLUDED.observacion,
              id_usuario = EXCLUDED.id_usuario
          `;
          await client.query(query, [reg.id_estudiante, fecha, jornada, reg.estado, obs, id_usuario]);
        }

        await client.query('COMMIT');
        return res.json({
          message: `Se registraron/actualizaron correctamente las asistencias de ${registros.length} estudiante(s).`,
          total: registros.length,
          fecha,
          jornada
        });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      const db = loadLocalDB();
      let nextId = db.asistencias.length > 0 ? Math.max(...db.asistencias.map((a) => a.id_asistencia)) + 1 : 1;

      for (const reg of registros) {
        const obs = reg.observacion ? String(reg.observacion).trim() : null;
        const existingIdx = db.asistencias.findIndex(
          (a) => a.id_estudiante === reg.id_estudiante && a.fecha === fecha && a.jornada === jornada
        );

        if (existingIdx >= 0) {
          // Update existing attendance (respecting unique constraint)
          db.asistencias[existingIdx].estado = reg.estado;
          db.asistencias[existingIdx].observacion = obs;
          db.asistencias[existingIdx].id_usuario = id_usuario;
        } else {
          // Insert new attendance
          const nueva: Asistencia = {
            id_asistencia: nextId++,
            id_estudiante: reg.id_estudiante,
            fecha,
            jornada,
            estado: reg.estado,
            observacion: obs,
            id_usuario,
            creado_en: new Date().toISOString()
          };
          db.asistencias.push(nueva);
        }
      }

      saveLocalDB(db);
      return res.json({
        message: `Se registraron/actualizaron correctamente las asistencias de ${registros.length} estudiante(s).`,
        total: registros.length,
        fecha,
        jornada
      });
    }
  } catch (err: any) {
    console.error('Error al guardar lote de asistencias:', err);
    return res.status(500).json({ error: 'Error al registrar las asistencias en la base de datos.' });
  }
});

// GET /api/asistencias/planilla - Cargar planilla de asistencia para un curso, fecha y jornada
router.get('/planilla', authenticateToken, async (req, res: Response) => {
  try {
    const { id_curso, fecha, jornada } = req.query;

    if (!id_curso || !fecha || !jornada) {
      return res.status(400).json({ error: 'id_curso, fecha y jornada son requeridos.' });
    }

    const cursoId = Number(id_curso);

    if (pgPool) {
      // Active students in course with left join to asistencias for the given date & jornada
      const query = `
        SELECT e.id_estudiante, e.dni, e.apellido, e.nombre, e.estado AS estado_estudiante,
               a.id_asistencia, a.fecha, a.jornada,
               COALESCE(a.estado, 'P') AS estado,
               a.observacion,
               a.id_usuario,
               u.nombre_completo AS registrado_por
        FROM estudiantes e
        LEFT JOIN asistencias a ON e.id_estudiante = a.id_estudiante AND a.fecha = $1 AND a.jornada = $2
        LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
        WHERE e.id_curso = $3 AND e.estado = 'activo'
        ORDER BY e.apellido ASC, e.nombre ASC
      `;
      const result = await pgPool.query(query, [fecha, jornada, cursoId]);
      return res.json(result.rows);
    } else {
      const db = loadLocalDB();
      const activos = db.estudiantes.filter((e) => e.id_curso === cursoId && e.estado === 'activo');
      activos.sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));

      const rows = activos.map((e) => {
        const asis = db.asistencias.find(
          (a) => a.id_estudiante === e.id_estudiante && a.fecha === fecha && a.jornada === jornada
        );
        const usr = asis ? db.usuarios.find((u) => u.id_usuario === asis.id_usuario) : null;
        return {
          id_estudiante: e.id_estudiante,
          dni: e.dni,
          apellido: e.apellido,
          nombre: e.nombre,
          estado_estudiante: e.estado,
          id_asistencia: asis?.id_asistencia || null,
          fecha: asis?.fecha || fecha,
          jornada: asis?.jornada || jornada,
          estado: asis?.estado || 'P', // Defaults to 'P' for convenient one-click confirmation
          observacion: asis?.observacion || '',
          id_usuario: asis?.id_usuario || null,
          registrado_por: usr?.nombre_completo || null
        };
      });

      return res.json(rows);
    }
  } catch (err: any) {
    console.error('Error al cargar planilla de asistencias:', err);
    return res.status(500).json({ error: 'Error al consultar la planilla.' });
  }
});

export default router;
