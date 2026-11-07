import { Router, Response } from 'express';
import { pgPool, loadLocalDB, saveLocalDB, Curso } from '../db.ts';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// GET /api/cursos - Lista todos los cursos con conteo de estudiantes
router.get('/', authenticateToken, async (_req, res: Response) => {
  try {
    if (pgPool) {
      const query = `
        SELECT c.*, 
               COUNT(e.id_estudiante) AS total_estudiantes,
               COUNT(CASE WHEN e.estado = 'activo' THEN 1 END) AS total_activos
        FROM cursos c
        LEFT JOIN estudiantes e ON c.id_curso = e.id_curso
        GROUP BY c.id_curso
        ORDER BY c.anio ASC, c.division ASC
      `;
      const result = await pgPool.query(query);
      return res.json(result.rows);
    } else {
      const db = loadLocalDB();
      const cursosConConteo = db.cursos.map((c) => {
        const ests = db.estudiantes.filter((e) => e.id_curso === c.id_curso);
        const activos = ests.filter((e) => e.estado === 'activo').length;
        return {
          ...c,
          total_estudiantes: ests.length,
          total_activos: activos
        };
      });
      // Sort
      cursosConConteo.sort((a, b) => a.anio.localeCompare(b.anio) || a.division.localeCompare(b.division));
      return res.json(cursosConConteo);
    }
  } catch (err: any) {
    console.error('Error al obtener cursos:', err);
    return res.status(500).json({ error: 'Error al listar los cursos.' });
  }
});

// POST /api/cursos - Crear nuevo curso (Solo Administrador)
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { anio, division, turno } = req.body;

    if (!anio || !division || !turno) {
      return res.status(400).json({ error: 'Año, División y Turno son requeridos.' });
    }

    const turnosValidos = ['Mañana', 'Tarde', 'Vespertino'];
    if (!turnosValidos.includes(turno)) {
      return res.status(400).json({ error: 'Turno inválido. Debe ser Mañana, Tarde o Vespertino.' });
    }

    const cleanAnio = String(anio).trim();
    const cleanDivision = String(division).trim().toUpperCase();

    if (pgPool) {
      const exists = await pgPool.query(
        'SELECT id_curso FROM cursos WHERE anio = $1 AND division = $2 AND turno = $3',
        [cleanAnio, cleanDivision, turno]
      );
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un curso con el mismo Año, División y Turno.' });
      }

      const inserted = await pgPool.query(
        'INSERT INTO cursos (anio, division, turno) VALUES ($1, $2, $3) RETURNING *',
        [cleanAnio, cleanDivision, turno]
      );
      return res.status(201).json(inserted.rows[0]);
    } else {
      const db = loadLocalDB();
      const exists = db.cursos.some(
        (c) => c.anio === cleanAnio && c.division === cleanDivision && c.turno === turno
      );
      if (exists) {
        return res.status(400).json({ error: 'Ya existe un curso con el mismo Año, División y Turno.' });
      }

      const nextId = db.cursos.length > 0 ? Math.max(...db.cursos.map((c) => c.id_curso)) + 1 : 1;
      const nuevoCurso: Curso = {
        id_curso: nextId,
        anio: cleanAnio,
        division: cleanDivision,
        turno
      };
      db.cursos.push(nuevoCurso);
      saveLocalDB(db);

      return res.status(201).json({ ...nuevoCurso, total_estudiantes: 0, total_activos: 0 });
    }
  } catch (err: any) {
    console.error('Error al crear curso:', err);
    return res.status(500).json({ error: 'Error interno al registrar el curso.' });
  }
});

// PUT /api/cursos/:id - Modificar curso (Solo Administrador)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { anio, division, turno } = req.body;

    if (!anio || !division || !turno) {
      return res.status(400).json({ error: 'Año, División y Turno son requeridos.' });
    }

    const cleanAnio = String(anio).trim();
    const cleanDivision = String(division).trim().toUpperCase();

    if (pgPool) {
      // Check duplicate
      const dup = await pgPool.query(
        'SELECT id_curso FROM cursos WHERE anio = $1 AND division = $2 AND turno = $3 AND id_curso != $4',
        [cleanAnio, cleanDivision, turno, id]
      );
      if (dup.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe otro curso con el mismo Año, División y Turno.' });
      }

      const updated = await pgPool.query(
        'UPDATE cursos SET anio = $1, division = $2, turno = $3 WHERE id_curso = $4 RETURNING *',
        [cleanAnio, cleanDivision, turno, id]
      );
      if (updated.rows.length === 0) return res.status(404).json({ error: 'Curso no encontrado.' });
      return res.json(updated.rows[0]);
    } else {
      const db = loadLocalDB();
      const curso = db.cursos.find((c) => c.id_curso === id);
      if (!curso) return res.status(404).json({ error: 'Curso no encontrado.' });

      const dup = db.cursos.some(
        (c) => c.anio === cleanAnio && c.division === cleanDivision && c.turno === turno && c.id_curso !== id
      );
      if (dup) {
        return res.status(400).json({ error: 'Ya existe otro curso con el mismo Año, División y Turno.' });
      }

      curso.anio = cleanAnio;
      curso.division = cleanDivision;
      curso.turno = turno;
      saveLocalDB(db);

      return res.json(curso);
    }
  } catch (err: any) {
    console.error('Error al actualizar curso:', err);
    return res.status(500).json({ error: 'Error al actualizar el curso.' });
  }
});

// DELETE /api/cursos/:id - Eliminar curso (Solo Administrador)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (pgPool) {
      const estCheck = await pgPool.query('SELECT COUNT(*) FROM estudiantes WHERE id_curso = $1', [id]);
      if (Number(estCheck.rows[0].count) > 0) {
        return res.status(400).json({ error: 'No se puede eliminar el curso porque tiene estudiantes asignados.' });
      }

      const del = await pgPool.query('DELETE FROM cursos WHERE id_curso = $1 RETURNING *', [id]);
      if (del.rows.length === 0) return res.status(404).json({ error: 'Curso no encontrado.' });
      return res.json({ message: 'Curso eliminado correctamente.' });
    } else {
      const db = loadLocalDB();
      const hasStudents = db.estudiantes.some((e) => e.id_curso === id);
      if (hasStudents) {
        return res.status(400).json({ error: 'No se puede eliminar el curso porque tiene estudiantes asignados.' });
      }

      const idx = db.cursos.findIndex((c) => c.id_curso === id);
      if (idx === -1) return res.status(404).json({ error: 'Curso no encontrado.' });

      db.cursos.splice(idx, 1);
      saveLocalDB(db);
      return res.json({ message: 'Curso eliminado correctamente.' });
    }
  } catch (err: any) {
    console.error('Error al eliminar curso:', err);
    return res.status(500).json({ error: 'Error al eliminar el curso.' });
  }
});

export default router;
