import { Router, Response } from 'express';
import { pgPool, loadLocalDB } from '../db.ts';
import { authenticateToken } from '../auth.ts';

const router = Router();

// GET /api/historial/estudiante/:id - Historial completo de un estudiante con desglose estadístico
router.get('/estudiante/:id', authenticateToken, async (req, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (pgPool) {
      const estRes = await pgPool.query(
        `SELECT e.*, c.anio, c.division, c.turno
         FROM estudiantes e
         INNER JOIN cursos c ON e.id_curso = c.id_curso
         WHERE e.id_estudiante = $1`,
        [id]
      );
      if (estRes.rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado.' });

      const records = await pgPool.query(
        `SELECT a.*, u.nombre_completo AS registrado_por
         FROM asistencias a
         LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
         WHERE a.id_estudiante = $1
         ORDER BY a.fecha DESC, a.jornada DESC`,
        [id]
      );

      const rows = records.rows;
      const total = rows.length;
      const presentes = rows.filter((r) => r.estado === 'P').length;
      const ausentes = rows.filter((r) => r.estado === 'A').length;
      const tardanzas = rows.filter((r) => r.estado === 'T').length;
      const justificadas = rows.filter((r) => r.estado === 'AJ').length;

      const porcentajeAsistencia = total > 0 ? Number(((presentes + tardanzas) / total * 100).toFixed(1)) : 100;

      return res.json({
        estudiante: estRes.rows[0],
        resumen: {
          total,
          presentes,
          ausentes,
          tardanzas,
          justificadas,
          porcentajeAsistencia,
          porcentajeInasistencia: total > 0 ? Number((ausentes / total * 100).toFixed(1)) : 0
        },
        registros: rows
      });
    } else {
      const db = loadLocalDB();
      const est = db.estudiantes.find((e) => e.id_estudiante === id);
      if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      const cur = db.cursos.find((c) => c.id_curso === est.id_curso);

      const rows = db.asistencias
        .filter((a) => a.id_estudiante === id)
        .map((a) => {
          const u = db.usuarios.find((usr) => usr.id_usuario === a.id_usuario);
          return {
            ...a,
            registrado_por: u?.nombre_completo || 'Sistema'
          };
        });

      rows.sort((a, b) => b.fecha.localeCompare(a.fecha));

      const total = rows.length;
      const presentes = rows.filter((r) => r.estado === 'P').length;
      const ausentes = rows.filter((r) => r.estado === 'A').length;
      const tardanzas = rows.filter((r) => r.estado === 'T').length;
      const justificadas = rows.filter((r) => r.estado === 'AJ').length;

      const porcentajeAsistencia = total > 0 ? Number(((presentes + tardanzas) / total * 100).toFixed(1)) : 100;

      return res.json({
        estudiante: {
          ...est,
          anio: cur?.anio || '',
          division: cur?.division || '',
          turno: cur?.turno || ''
        },
        resumen: {
          total,
          presentes,
          ausentes,
          tardanzas,
          justificadas,
          porcentajeAsistencia,
          porcentajeInasistencia: total > 0 ? Number((ausentes / total * 100).toFixed(1)) : 0
        },
        registros: rows
      });
    }
  } catch (err: any) {
    console.error('Error al obtener historial del estudiante:', err);
    return res.status(500).json({ error: 'Error al consultar historial del estudiante.' });
  }
});

// GET /api/historial/resumen - Resumen y filtrado cruzado por curso, fecha, o rango
router.get('/resumen', authenticateToken, async (req, res: Response) => {
  try {
    const { id_curso, fecha_inicio, fecha_fin, mes, anio } = req.query;

    if (pgPool) {
      let where = 'WHERE 1=1';
      const params: any[] = [];

      if (id_curso) {
        params.push(Number(id_curso));
        where += ` AND e.id_curso = $${params.length}`;
      }

      if (fecha_inicio) {
        params.push(fecha_inicio);
        where += ` AND a.fecha >= $${params.length}`;
      }

      if (fecha_fin) {
        params.push(fecha_fin);
        where += ` AND a.fecha <= $${params.length}`;
      }

      if (mes) {
        params.push(Number(mes));
        where += ` AND EXTRACT(MONTH FROM a.fecha) = $${params.length}`;
      }

      if (anio) {
        params.push(Number(anio));
        where += ` AND EXTRACT(YEAR FROM a.fecha) = $${params.length}`;
      }

      const summaryQuery = `
        SELECT 
          COUNT(*) AS total_registros,
          COUNT(CASE WHEN a.estado = 'P' THEN 1 END) AS total_presentes,
          COUNT(CASE WHEN a.estado = 'A' THEN 1 END) AS total_ausentes,
          COUNT(CASE WHEN a.estado = 'T' THEN 1 END) AS total_tardanzas,
          COUNT(CASE WHEN a.estado = 'AJ' THEN 1 END) AS total_justificadas
        FROM asistencias a
        INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        ${where}
      `;
      const sumResult = await pgPool.query(summaryQuery, params);
      const sum = sumResult.rows[0];

      const total = Number(sum.total_registros);
      const presentes = Number(sum.total_presentes);
      const ausentes = Number(sum.total_ausentes);
      const tardanzas = Number(sum.total_tardanzas);
      const justificadas = Number(sum.total_justificadas);

      const listQuery = `
        SELECT a.*, e.dni, e.apellido, e.nombre, c.anio, c.division, c.turno,
               u.nombre_completo AS registrado_por
        FROM asistencias a
        INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
        ${where}
        ORDER BY a.fecha DESC, c.anio ASC, c.division ASC, e.apellido ASC
        LIMIT 200
      `;
      const listResult = await pgPool.query(listQuery, params);

      return res.json({
        resumen: {
          total,
          presentes,
          ausentes,
          tardanzas,
          justificadas,
          porcentajeAsistencia: total > 0 ? Number(((presentes + tardanzas) / total * 100).toFixed(1)) : 0,
          porcentajeInasistencia: total > 0 ? Number((ausentes / total * 100).toFixed(1)) : 0
        },
        registros: listResult.rows
      });
    } else {
      const db = loadLocalDB();
      let filtered = db.asistencias.map((a) => {
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
          registrado_por: usr?.nombre_completo || 'Sistema'
        };
      });

      if (id_curso) {
        filtered = filtered.filter((r) => r.id_curso === Number(id_curso));
      }

      if (fecha_inicio) {
        filtered = filtered.filter((r) => r.fecha >= String(fecha_inicio));
      }

      if (fecha_fin) {
        filtered = filtered.filter((r) => r.fecha <= String(fecha_fin));
      }

      if (mes) {
        filtered = filtered.filter((r) => new Date(r.fecha).getUTCMonth() + 1 === Number(mes));
      }

      if (anio) {
        filtered = filtered.filter((r) => new Date(r.fecha).getUTCFullYear() === Number(anio));
      }

      const total = filtered.length;
      const presentes = filtered.filter((r) => r.estado === 'P').length;
      const ausentes = filtered.filter((r) => r.estado === 'A').length;
      const tardanzas = filtered.filter((r) => r.estado === 'T').length;
      const justificadas = filtered.filter((r) => r.estado === 'AJ').length;

      filtered.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.apellido.localeCompare(b.apellido));

      return res.json({
        resumen: {
          total,
          presentes,
          ausentes,
          tardanzas,
          justificadas,
          porcentajeAsistencia: total > 0 ? Number(((presentes + tardanzas) / total * 100).toFixed(1)) : 0,
          porcentajeInasistencia: total > 0 ? Number((ausentes / total * 100).toFixed(1)) : 0
        },
        registros: filtered.slice(0, 200)
      });
    }
  } catch (err: any) {
    console.error('Error al generar resumen de historial:', err);
    return res.status(500).json({ error: 'Error al consultar historial.' });
  }
});

export default router;
