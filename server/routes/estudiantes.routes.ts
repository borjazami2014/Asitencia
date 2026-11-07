import { Router, Response } from 'express';
import { pgPool, loadLocalDB, saveLocalDB, Estudiante } from '../db.ts';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth.ts';

const router = Router();

/**
 * Normaliza un texto removiendo acentos/diacríticos, convirtiendo a minúsculas y limpiando espacios
 */
export function normalizarTexto(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

let isUnaccentAvailable: boolean | null = null;
async function hasUnaccentExtension(pool: any): Promise<boolean> {
  if (isUnaccentAvailable !== null) return isUnaccentAvailable;
  try {
    await pool.query("SELECT unaccent('test')");
    isUnaccentAvailable = true;
  } catch {
    isUnaccentAvailable = false;
  }
  return isUnaccentAvailable;
}

// GET /api/estudiantes - Buscar por DNI, por apellido, por nombre o nombre completo ignorando acentos y mayúsculas
router.get('/', authenticateToken, async (req, res: Response) => {
  try {
    const { id_curso, search, estado } = req.query;

    if (pgPool) {
      let query = `
        SELECT e.*, c.anio, c.division, c.turno
        FROM estudiantes e
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        WHERE 1=1
      `;
      const params: any[] = [];

      if (id_curso) {
        params.push(Number(id_curso));
        query += ` AND e.id_curso = $${params.length}`;
      }

      if (estado && estado !== 'todos') {
        params.push(estado);
        query += ` AND e.estado = $${params.length}`;
      }

      if (search && String(search).trim() !== '') {
        const cleanSearch = String(search).trim();
        const searchNorm = normalizarTexto(cleanSearch);
        const searchWords = searchNorm.split(/\s+/).filter(Boolean);

        const useUnaccent = await hasUnaccentExtension(pgPool);
        const normSQL = (col: string) => {
          if (useUnaccent) {
            return `unaccent(LOWER(COALESCE(${col}, '')))`;
          }
          return `TRANSLATE(LOWER(COALESCE(${col}, '')), 'áéíóúäëïöüñàèìòùâêîôû', 'aeiouaeiounaeiouaeiou')`;
        };

        if (searchWords.length <= 1) {
          params.push(`%${searchNorm}%`);
          const p = params.length;
          query += ` AND (
            ${normSQL('e.dni')} LIKE $${p}
            OR ${normSQL('e.apellido')} LIKE $${p}
            OR ${normSQL('e.nombre')} LIKE $${p}
            OR ${normSQL("e.nombre || ' ' || e.apellido")} LIKE $${p}
            OR ${normSQL("e.apellido || ' ' || e.nombre")} LIKE $${p}
          )`;
        } else {
          // Búsqueda por nombre y apellido combinados (ej. "José Pérez", "Perez Jose")
          params.push(`%${searchNorm}%`);
          const fullIdx = params.length;

          const wordConditions: string[] = [];
          for (const w of searchWords) {
            params.push(`%${w}%`);
            const wIdx = params.length;
            wordConditions.push(`(${normSQL("e.dni || ' ' || e.nombre || ' ' || e.apellido")} LIKE $${wIdx})`);
          }

          query += ` AND (
            ${normSQL("e.nombre || ' ' || e.apellido")} LIKE $${fullIdx}
            OR ${normSQL("e.apellido || ' ' || e.nombre")} LIKE $${fullIdx}
            OR (${wordConditions.join(' AND ')})
          )`;
        }
      }

      query += ` ORDER BY e.apellido ASC, e.nombre ASC`;
      const result = await pgPool.query(query, params);
      return res.json(result.rows);
    } else {
      const db = loadLocalDB();
      let list = db.estudiantes.map((e) => {
        const c = db.cursos.find((cur) => cur.id_curso === e.id_curso);
        return {
          ...e,
          anio: c?.anio || '',
          division: c?.division || '',
          turno: c?.turno || ''
        };
      });

      if (id_curso) {
        list = list.filter((e) => e.id_curso === Number(id_curso));
      }

      if (estado && estado !== 'todos') {
        list = list.filter((e) => e.estado === estado);
      }

      if (search && String(search).trim() !== '') {
        const cleanSearch = String(search).trim();
        const searchNorm = normalizarTexto(cleanSearch);
        const searchWords = searchNorm.split(/\s+/).filter(Boolean);

        list = list.filter((e) => {
          const dniNorm = normalizarTexto(e.dni);
          const apellidoNorm = normalizarTexto(e.apellido);
          const nombreNorm = normalizarTexto(e.nombre);
          const nomApe = `${nombreNorm} ${apellidoNorm}`;
          const apeNom = `${apellidoNorm} ${nombreNorm}`;
          const combined = `${dniNorm} ${nombreNorm} ${apellidoNorm}`;

          // Coincidencia exacta o parcial de frase completa
          if (
            dniNorm.includes(searchNorm) ||
            apellidoNorm.includes(searchNorm) ||
            nombreNorm.includes(searchNorm) ||
            nomApe.includes(searchNorm) ||
            apeNom.includes(searchNorm)
          ) {
            return true;
          }

          // Si escribió varias palabras (ej. "Jose Perez" o "Perez Jose"), verificar que cada una esté presente
          if (searchWords.length > 1) {
            return searchWords.every((w) => combined.includes(w));
          }

          return false;
        });
      }

      list.sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error al consultar estudiantes:', err);
    return res.status(500).json({ error: 'Error al consultar estudiantes.' });
  }
});

// GET /api/estudiantes/:id - Detalle de un estudiante
router.get('/:id', authenticateToken, async (req, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (pgPool) {
      const query = `
        SELECT e.*, c.anio, c.division, c.turno
        FROM estudiantes e
        INNER JOIN cursos c ON e.id_curso = c.id_curso
        WHERE e.id_estudiante = $1
      `;
      const result = await pgPool.query(query, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      return res.json(result.rows[0]);
    } else {
      const db = loadLocalDB();
      const e = db.estudiantes.find((est) => est.id_estudiante === id);
      if (!e) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      const c = db.cursos.find((cur) => cur.id_curso === e.id_curso);
      return res.json({
        ...e,
        anio: c?.anio || '',
        division: c?.division || '',
        turno: c?.turno || ''
      });
    }
  } catch (err: any) {
    console.error('Error al obtener estudiante:', err);
    return res.status(500).json({ error: 'Error al obtener datos del estudiante.' });
  }
});

// POST /api/estudiantes - Registrar nuevo estudiante
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dni, apellido, nombre, id_curso, estado = 'activo' } = req.body;

    if (!dni || !apellido || !nombre || !id_curso) {
      return res.status(400).json({ error: 'DNI, Apellido, Nombre y Curso son obligatorios.' });
    }

    const cleanDni = String(dni).trim();
    const cleanApellido = String(apellido).trim();
    const cleanNombre = String(nombre).trim();
    const cursoId = Number(id_curso);

    // DNI format validation (numeric, 7-10 digits)
    if (!/^\d{7,10}$/.test(cleanDni)) {
      return res.status(400).json({ error: 'El DNI debe contener entre 7 y 10 dígitos numéricos sin puntos ni espacios.' });
    }

    if (pgPool) {
      // Validate Course exists
      const cursoCheck = await pgPool.query('SELECT id_curso FROM cursos WHERE id_curso = $1', [cursoId]);
      if (cursoCheck.rows.length === 0) {
        return res.status(400).json({ error: 'El curso seleccionado no existe.' });
      }

      // Check duplicate DNI
      const dniCheck = await pgPool.query('SELECT id_estudiante FROM estudiantes WHERE dni = $1', [cleanDni]);
      if (dniCheck.rows.length > 0) {
        return res.status(400).json({ error: `Ya existe un estudiante registrado con el DNI ${cleanDni}.` });
      }

      const inserted = await pgPool.query(
        `INSERT INTO estudiantes (dni, apellido, nombre, id_curso, estado)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [cleanDni, cleanApellido, cleanNombre, cursoId, estado]
      );
      return res.status(201).json(inserted.rows[0]);
    } else {
      const db = loadLocalDB();
      const cursoExists = db.cursos.some((c) => c.id_curso === cursoId);
      if (!cursoExists) {
        return res.status(400).json({ error: 'El curso seleccionado no existe.' });
      }

      const dniExists = db.estudiantes.some((e) => e.dni === cleanDni);
      if (dniExists) {
        return res.status(400).json({ error: `Ya existe un estudiante registrado con el DNI ${cleanDni}.` });
      }

      const nextId = db.estudiantes.length > 0 ? Math.max(...db.estudiantes.map((e) => e.id_estudiante)) + 1 : 1;
      const nuevoEstudiante: Estudiante = {
        id_estudiante: nextId,
        dni: cleanDni,
        apellido: cleanApellido,
        nombre: cleanNombre,
        id_curso: cursoId,
        estado: estado === 'inactivo' ? 'inactivo' : 'activo',
        creado_en: new Date().toISOString()
      };

      db.estudiantes.push(nuevoEstudiante);
      saveLocalDB(db);

      const c = db.cursos.find((cur) => cur.id_curso === cursoId);
      return res.status(201).json({
        ...nuevoEstudiante,
        anio: c?.anio || '',
        division: c?.division || '',
        turno: c?.turno || ''
      });
    }
  } catch (err: any) {
    console.error('Error al registrar estudiante:', err);
    return res.status(500).json({ error: 'Error al registrar el estudiante.' });
  }
});

// PUT /api/estudiantes/:id - Editar estudiante
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { dni, apellido, nombre, id_curso, estado } = req.body;

    if (!dni || !apellido || !nombre || !id_curso) {
      return res.status(400).json({ error: 'DNI, Apellido, Nombre y Curso son obligatorios.' });
    }

    const cleanDni = String(dni).trim();
    const cleanApellido = String(apellido).trim();
    const cleanNombre = String(nombre).trim();
    const cursoId = Number(id_curso);

    if (!/^\d{7,10}$/.test(cleanDni)) {
      return res.status(400).json({ error: 'El DNI debe contener entre 7 y 10 dígitos numéricos.' });
    }

    if (pgPool) {
      // Check duplicate DNI for another student
      const dniCheck = await pgPool.query(
        'SELECT id_estudiante FROM estudiantes WHERE dni = $1 AND id_estudiante != $2',
        [cleanDni, id]
      );
      if (dniCheck.rows.length > 0) {
        return res.status(400).json({ error: `Ya existe otro estudiante con el DNI ${cleanDni}.` });
      }

      const updated = await pgPool.query(
        `UPDATE estudiantes
         SET dni = $1, apellido = $2, nombre = $3, id_curso = $4, estado = $5
         WHERE id_estudiante = $6
         RETURNING *`,
        [cleanDni, cleanApellido, cleanNombre, cursoId, estado || 'activo', id]
      );

      if (updated.rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      return res.json(updated.rows[0]);
    } else {
      const db = loadLocalDB();
      const estudiante = db.estudiantes.find((e) => e.id_estudiante === id);
      if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });

      const dniDup = db.estudiantes.some((e) => e.dni === cleanDni && e.id_estudiante !== id);
      if (dniDup) {
        return res.status(400).json({ error: `Ya existe otro estudiante con el DNI ${cleanDni}.` });
      }

      estudiante.dni = cleanDni;
      estudiante.apellido = cleanApellido;
      estudiante.nombre = cleanNombre;
      estudiante.id_curso = cursoId;
      if (estado) estudiante.estado = estado;

      saveLocalDB(db);

      const c = db.cursos.find((cur) => cur.id_curso === cursoId);
      return res.json({
        ...estudiante,
        anio: c?.anio || '',
        division: c?.division || '',
        turno: c?.turno || ''
      });
    }
  } catch (err: any) {
    console.error('Error al actualizar estudiante:', err);
    return res.status(500).json({ error: 'Error al actualizar estudiante.' });
  }
});

// PATCH /api/estudiantes/:id/estado - Dar de baja / alta lógica
router.patch('/:id/estado', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ error: "El estado debe ser 'activo' o 'inactivo'." });
    }

    if (pgPool) {
      const updated = await pgPool.query(
        'UPDATE estudiantes SET estado = $1 WHERE id_estudiante = $2 RETURNING *',
        [estado, id]
      );
      if (updated.rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      return res.json(updated.rows[0]);
    } else {
      const db = loadLocalDB();
      const estudiante = db.estudiantes.find((e) => e.id_estudiante === id);
      if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });

      estudiante.estado = estado;
      saveLocalDB(db);
      return res.json(estudiante);
    }
  } catch (err: any) {
    console.error('Error al cambiar estado del estudiante:', err);
    return res.status(500).json({ error: 'Error al cambiar estado del estudiante.' });
  }
});

// DELETE /api/estudiantes/:id - Eliminar estudiante (Solo Administrador)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (pgPool) {
      // In PostgreSQL, asistencias cascade delete or restrict
      const del = await pgPool.query('DELETE FROM estudiantes WHERE id_estudiante = $1 RETURNING *', [id]);
      if (del.rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      return res.json({ message: 'Estudiante eliminado del sistema.' });
    } else {
      const db = loadLocalDB();
      const idx = db.estudiantes.findIndex((e) => e.id_estudiante === id);
      if (idx === -1) return res.status(404).json({ error: 'Estudiante no encontrado.' });

      // Remove associated attendances
      db.asistencias = db.asistencias.filter((a) => a.id_estudiante !== id);
      db.estudiantes.splice(idx, 1);
      saveLocalDB(db);
      return res.json({ message: 'Estudiante eliminado del sistema.' });
    }
  } catch (err: any) {
    console.error('Error al eliminar estudiante:', err);
    return res.status(500).json({ error: 'Error al eliminar el estudiante.' });
  }
});

export default router;
