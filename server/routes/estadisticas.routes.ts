import { Router, Response } from 'express';
import { pgPool, loadLocalDB } from '../db.ts';
import { authenticateToken } from '../auth.ts';

const router = Router();

// GET /api/estadisticas/dashboard - Métricas principales del dashboard
router.get('/dashboard', authenticateToken, async (_req, res: Response) => {
  try {
    if (pgPool) {
      // 1. Estudiantes counts
      const estRes = await pgPool.query(`
        SELECT 
          COUNT(*) AS total_estudiantes,
          COUNT(CASE WHEN estado = 'activo' THEN 1 END) AS total_activos,
          COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) AS total_inactivos
        FROM estudiantes
      `);

      // 2. Cursos count
      const cursosRes = await pgPool.query('SELECT COUNT(*) AS total_cursos FROM cursos');

      // 3. Asistencias counts
      const asisRes = await pgPool.query(`
        SELECT 
          COUNT(*) AS total_asistencias,
          COUNT(CASE WHEN estado = 'P' THEN 1 END) AS total_presentes,
          COUNT(CASE WHEN estado = 'A' THEN 1 END) AS total_ausentes,
          COUNT(CASE WHEN estado = 'T' THEN 1 END) AS total_tardanzas,
          COUNT(CASE WHEN estado = 'AJ' THEN 1 END) AS total_justificadas
        FROM asistencias
      `);

      // 4. Asistencia hoy
      const hoy = new Date().toISOString().split('T')[0];
      const hoyRes = await pgPool.query(`
        SELECT 
          COUNT(*) AS total_hoy,
          COUNT(CASE WHEN estado = 'P' THEN 1 END) AS presentes_hoy,
          COUNT(CASE WHEN estado = 'A' THEN 1 END) AS ausentes_hoy
        FROM asistencias
        WHERE fecha = $1
      `, [hoy]);

      // 5. Estudiantes con más ausencias
      const topAusenciasRes = await pgPool.query(`
        SELECT 
          e.id_estudiante, e.dni, e.apellido, e.nombre,
          c.anio, c.division,
          COUNT(a.id_asistencia) AS total_ausencias
        FROM asistencias a
        INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        WHERE a.estado = 'A'
        GROUP BY e.id_estudiante, e.dni, e.apellido, e.nombre, c.anio, c.division
        ORDER BY total_ausencias DESC
        LIMIT 5
      `);

      // 6. Comparación entre cursos
      const comparacionCursosRes = await pgPool.query(`
        SELECT 
          c.id_curso, c.anio, c.division, c.turno,
          COUNT(DISTINCT e.id_estudiante) AS total_estudiantes,
          COUNT(a.id_asistencia) AS total_registros,
          COUNT(CASE WHEN a.estado = 'P' THEN 1 END) AS presentes,
          COUNT(CASE WHEN a.estado = 'A' THEN 1 END) AS ausentes,
          COUNT(CASE WHEN a.estado = 'T' THEN 1 END) AS tardanzas,
          COUNT(CASE WHEN a.estado = 'AJ' THEN 1 END) AS justificadas
        FROM cursos c
        LEFT JOIN estudiantes e ON c.id_curso = e.id_curso AND e.estado = 'activo'
        LEFT JOIN asistencias a ON e.id_estudiante = a.id_estudiante
        GROUP BY c.id_curso, c.anio, c.division, c.turno
        ORDER BY c.anio ASC, c.division ASC
      `);

      const totalEstudiantes = Number(estRes.rows[0].total_estudiantes);
      const totalActivos = Number(estRes.rows[0].total_activos);
      const totalInactivos = Number(estRes.rows[0].total_inactivos);
      const totalCursos = Number(cursosRes.rows[0].total_cursos);

      const aStat = asisRes.rows[0];
      const totalAsis = Number(aStat.total_asistencias);
      const presentes = Number(aStat.total_presentes);
      const ausentes = Number(aStat.total_ausentes);
      const tardanzas = Number(aStat.total_tardanzas);
      const justificadas = Number(aStat.total_justificadas);

      const porcentajeAsistencia = totalAsis > 0 ? Number(((presentes + tardanzas) / totalAsis * 100).toFixed(1)) : 100;
      const porcentajeInasistencia = totalAsis > 0 ? Number((ausentes / totalAsis * 100).toFixed(1)) : 0;

      const cursosComparativa = comparacionCursosRes.rows.map((r) => {
        const reg = Number(r.total_registros);
        const pres = Number(r.presentes);
        const tard = Number(r.tardanzas);
        const aus = Number(r.ausentes);
        const just = Number(r.justificadas);
        const pct = reg > 0 ? Number(((pres + tard) / reg * 100).toFixed(1)) : 100;
        return {
          id_curso: r.id_curso,
          nombre_curso: `${r.anio} "${r.division}" (${r.turno})`,
          total_estudiantes: Number(r.total_estudiantes),
          total_registros: reg,
          presentes: pres,
          ausentes: aus,
          tardanzas: tard,
          justificadas: just,
          porcentaje_asistencia: pct
        };
      });

      return res.json({
        kpis: {
          totalEstudiantes,
          totalActivos,
          totalInactivos,
          totalCursos,
          porcentajeAsistencia,
          porcentajeInasistencia,
          totalAsistenciasRegistradas: totalAsis,
          presentes,
          ausentes,
          tardanzas,
          justificadas,
          hoy: {
            fecha: hoy,
            total: Number(hoyRes.rows[0].total_hoy),
            presentes: Number(hoyRes.rows[0].presentes_hoy),
            ausentes: Number(hoyRes.rows[0].ausentes_hoy)
          }
        },
        estudiantesConMasAusencias: topAusenciasRes.rows,
        comparacionCursos: cursosComparativa
      });
    } else {
      const db = loadLocalDB();
      const totalEstudiantes = db.estudiantes.length;
      const totalActivos = db.estudiantes.filter((e) => e.estado === 'activo').length;
      const totalInactivos = db.estudiantes.filter((e) => e.estado === 'inactivo').length;
      const totalCursos = db.cursos.length;

      const totalAsis = db.asistencias.length;
      const presentes = db.asistencias.filter((a) => a.estado === 'P').length;
      const ausentes = db.asistencias.filter((a) => a.estado === 'A').length;
      const tardanzas = db.asistencias.filter((a) => a.estado === 'T').length;
      const justificadas = db.asistencias.filter((a) => a.estado === 'AJ').length;

      const porcentajeAsistencia = totalAsis > 0 ? Number(((presentes + tardanzas) / totalAsis * 100).toFixed(1)) : 100;
      const porcentajeInasistencia = totalAsis > 0 ? Number((ausentes / totalAsis * 100).toFixed(1)) : 0;

      const hoy = new Date().toISOString().split('T')[0];
      const hoyRegs = db.asistencias.filter((a) => a.fecha === hoy);
      const hoyPres = hoyRegs.filter((a) => a.estado === 'P').length;
      const hoyAus = hoyRegs.filter((a) => a.estado === 'A').length;

      // Top students with highest absences
      const ausenciaMap = new Map<number, number>();
      db.asistencias.forEach((a) => {
        if (a.estado === 'A') {
          ausenciaMap.set(a.id_estudiante, (ausenciaMap.get(a.id_estudiante) || 0) + 1);
        }
      });

      const topAusencias = Array.from(ausenciaMap.entries())
        .map(([id, count]) => {
          const est = db.estudiantes.find((e) => e.id_estudiante === id);
          const cur = est ? db.cursos.find((c) => c.id_curso === est.id_curso) : undefined;
          return {
            id_estudiante: id,
            dni: est?.dni || '',
            apellido: est?.apellido || '',
            nombre: est?.nombre || '',
            anio: cur?.anio || '',
            division: cur?.division || '',
            total_ausencias: count
          };
        })
        .sort((a, b) => b.total_ausencias - a.total_ausencias)
        .slice(0, 5);

      // Comparación cursos
      const comparacionCursos = db.cursos.map((c) => {
        const ests = db.estudiantes.filter((e) => e.id_curso === c.id_curso && e.estado === 'activo');
        const estIds = new Set(ests.map((e) => e.id_estudiante));
        const regs = db.asistencias.filter((a) => estIds.has(a.id_estudiante));

        const regCount = regs.length;
        const pres = regs.filter((r) => r.estado === 'P').length;
        const aus = regs.filter((r) => r.estado === 'A').length;
        const tard = regs.filter((r) => r.estado === 'T').length;
        const just = regs.filter((r) => r.estado === 'AJ').length;
        const pct = regCount > 0 ? Number(((pres + tard) / regCount * 100).toFixed(1)) : 100;

        return {
          id_curso: c.id_curso,
          nombre_curso: `${c.anio} "${c.division}" (${c.turno})`,
          total_estudiantes: ests.length,
          total_registros: regCount,
          presentes: pres,
          ausentes: aus,
          tardanzas: tard,
          justificadas: just,
          porcentaje_asistencia: pct
        };
      });

      return res.json({
        kpis: {
          totalEstudiantes,
          totalActivos,
          totalInactivos,
          totalCursos,
          porcentajeAsistencia,
          porcentajeInasistencia,
          totalAsistenciasRegistradas: totalAsis,
          presentes,
          ausentes,
          tardanzas,
          justificadas,
          hoy: {
            fecha: hoy,
            total: hoyRegs.length,
            presentes: hoyPres,
            ausentes: hoyAus
          }
        },
        estudiantesConMasAusencias: topAusencias,
        comparacionCursos
      });
    }
  } catch (err: any) {
    console.error('Error al generar estadísticas de dashboard:', err);
    return res.status(500).json({ error: 'Error al consultar las estadísticas.' });
  }
});

export default router;
