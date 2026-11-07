import { Router, Response } from 'express';
import { pgPool, loadLocalDB } from '../db.ts';
import { authenticateToken } from '../auth.ts';

const router = Router();

// GET /api/informes/datos - Reporte tabular con filtros
router.get('/datos', authenticateToken, async (req, res: Response) => {
  try {
    const { id_curso, fecha_desde, fecha_hasta, estado } = req.query;

    if (pgPool) {
      let query = `
        SELECT a.id_asistencia, a.fecha, a.jornada, a.estado, a.observacion,
               e.dni, e.apellido, e.nombre,
               c.anio, c.division, c.turno,
               u.nombre_completo AS registrado_por
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

      if (fecha_desde) {
        params.push(fecha_desde);
        query += ` AND a.fecha >= $${params.length}`;
      }

      if (fecha_hasta) {
        params.push(fecha_hasta);
        query += ` AND a.fecha <= $${params.length}`;
      }

      if (estado && estado !== 'todos') {
        params.push(estado);
        query += ` AND a.estado = $${params.length}`;
      }

      query += ` ORDER BY a.fecha DESC, c.anio ASC, c.division ASC, e.apellido ASC`;
      const result = await pgPool.query(query, params);
      return res.json(result.rows);
    } else {
      const db = loadLocalDB();
      let list = db.asistencias.map((a) => {
        const est = db.estudiantes.find((e) => e.id_estudiante === a.id_estudiante);
        const cur = est ? db.cursos.find((c) => c.id_curso === est.id_curso) : undefined;
        const usr = db.usuarios.find((u) => u.id_usuario === a.id_usuario);
        return {
          id_asistencia: a.id_asistencia,
          fecha: a.fecha,
          jornada: a.jornada,
          estado: a.estado,
          observacion: a.observacion,
          id_curso: est?.id_curso || 0,
          dni: est?.dni || '',
          apellido: est?.apellido || '',
          nombre: est?.nombre || '',
          anio: cur?.anio || '',
          division: cur?.division || '',
          turno: cur?.turno || '',
          registrado_por: usr?.nombre_completo || 'Sistema'
        };
      });

      if (id_curso) {
        list = list.filter((r) => r.id_curso === Number(id_curso));
      }

      if (fecha_desde) {
        list = list.filter((r) => r.fecha >= String(fecha_desde));
      }

      if (fecha_hasta) {
        list = list.filter((r) => r.fecha <= String(fecha_hasta));
      }

      if (estado && estado !== 'todos') {
        list = list.filter((r) => r.estado === estado);
      }

      list.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.apellido.localeCompare(b.apellido));
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error al generar informe:', err);
    return res.status(500).json({ error: 'Error al consultar el informe.' });
  }
});

// GET /api/informes/exportar-csv - Descargar informe en formato CSV con UTF-8 BOM
router.get('/exportar-csv', authenticateToken, async (req, res: Response) => {
  try {
    const { id_curso, fecha_desde, fecha_hasta, estado } = req.query;

    let rows: any[] = [];

    if (pgPool) {
      let query = `
        SELECT a.fecha, a.jornada, a.estado,
               CASE 
                 WHEN a.estado = 'P' THEN 'Presente'
                 WHEN a.estado = 'A' THEN 'Ausente'
                 WHEN a.estado = 'T' THEN 'Tardanza'
                 WHEN a.estado = 'AJ' THEN 'Ausente Justificado'
                 ELSE a.estado
               END AS descripcion_estado,
               e.dni, e.apellido, e.nombre,
               c.anio, c.division, c.turno,
               COALESCE(a.observacion, '') AS observacion,
               u.nombre_completo AS registrado_por
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

      if (fecha_desde) {
        params.push(fecha_desde);
        query += ` AND a.fecha >= $${params.length}`;
      }

      if (fecha_hasta) {
        params.push(fecha_hasta);
        query += ` AND a.fecha <= $${params.length}`;
      }

      if (estado && estado !== 'todos') {
        params.push(estado);
        query += ` AND a.estado = $${params.length}`;
      }

      query += ` ORDER BY a.fecha DESC, c.anio ASC, c.division ASC, e.apellido ASC`;
      const result = await pgPool.query(query, params);
      rows = result.rows;
    } else {
      const db = loadLocalDB();
      let list = db.asistencias.map((a) => {
        const est = db.estudiantes.find((e) => e.id_estudiante === a.id_estudiante);
        const cur = est ? db.cursos.find((c) => c.id_curso === est.id_curso) : undefined;
        const usr = db.usuarios.find((u) => u.id_usuario === a.id_usuario);

        let desc = 'Presente';
        if (a.estado === 'A') desc = 'Ausente';
        if (a.estado === 'T') desc = 'Tardanza';
        if (a.estado === 'AJ') desc = 'Ausente Justificado';

        return {
          fecha: a.fecha,
          jornada: a.jornada,
          estado: a.estado,
          descripcion_estado: desc,
          id_curso: est?.id_curso || 0,
          dni: est?.dni || '',
          apellido: est?.apellido || '',
          nombre: est?.nombre || '',
          anio: cur?.anio || '',
          division: cur?.division || '',
          turno: cur?.turno || '',
          observacion: a.observacion || '',
          registrado_por: usr?.nombre_completo || 'Sistema'
        };
      });

      if (id_curso) list = list.filter((r) => r.id_curso === Number(id_curso));
      if (fecha_desde) list = list.filter((r) => r.fecha >= String(fecha_desde));
      if (fecha_hasta) list = list.filter((r) => r.fecha <= String(fecha_hasta));
      if (estado && estado !== 'todos') list = list.filter((r) => r.estado === estado);

      list.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.apellido.localeCompare(b.apellido));
      rows = list;
    }

    // Build CSV with Header
    const headers = ['Fecha', 'Jornada', 'Curso', 'DNI', 'Apellido', 'Nombre', 'Estado', 'Detalle Estado', 'Observación', 'Registrado Por'];
    const csvLines = [headers.join(';')];

    for (const r of rows) {
      const escapeCsv = (val: any) => {
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      };

      const line = [
        escapeCsv(r.fecha),
        escapeCsv(r.jornada),
        escapeCsv(`${r.anio} ${r.division} (${r.turno})`),
        escapeCsv(r.dni),
        escapeCsv(r.apellido),
        escapeCsv(r.nombre),
        escapeCsv(r.estado),
        escapeCsv(r.descripcion_estado),
        escapeCsv(r.observacion),
        escapeCsv(r.registrado_por)
      ].join(';');
      csvLines.push(line);
    }

    // UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const filename = `asistrack_informe_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err: any) {
    console.error('Error al exportar CSV:', err);
    return res.status(500).json({ error: 'Error al generar archivo CSV.' });
  }
});

export default router;
