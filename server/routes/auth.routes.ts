import { Router, Response } from 'express';
import { pgPool, loadLocalDB, saveLocalDB, Usuario } from '../db.ts';
import {
  generateToken,
  verifyPassword,
  hashPassword,
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest
} from '../auth.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { nombre_usuario, password } = req.body;

    if (!nombre_usuario || !password) {
      return res.status(400).json({ error: 'Por favor ingrese usuario y contraseña.' });
    }

    let user: Usuario | undefined;

    if (pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM usuarios WHERE LOWER(nombre_usuario) = LOWER($1)',
        [nombre_usuario.trim()]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } else {
      const db = loadLocalDB();
      user = db.usuarios.find(
        (u) => u.nombre_usuario.toLowerCase() === nombre_usuario.trim().toLowerCase()
      );
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no encontrado.' });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas. Contraseña incorrecta.' });
    }

    const token = generateToken({
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      rol: user.rol,
      nombre_completo: user.nombre_completo
    });

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        rol: user.rol,
        nombre_completo: user.nombre_completo
      }
    });
  } catch (err: any) {
    console.error('Error en /api/auth/login:', err);
    return res.status(500).json({ error: 'Error interno del servidor al autenticar.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ usuario: req.user });
});

// GET /api/auth/usuarios (Solo Administradores)
router.get('/usuarios', authenticateToken, requireAdmin, async (_req, res: Response) => {
  try {
    if (pgPool) {
      const result = await pgPool.query(
        'SELECT id_usuario, nombre_usuario, rol, nombre_completo, creado_en FROM usuarios ORDER BY id_usuario ASC'
      );
      return res.json(result.rows);
    } else {
      const db = loadLocalDB();
      const safeUsers = db.usuarios.map(({ password_hash, ...rest }) => rest);
      return res.json(safeUsers);
    }
  } catch (err: any) {
    console.error('Error al obtener usuarios:', err);
    return res.status(500).json({ error: 'Error al consultar la lista de usuarios.' });
  }
});

// POST /api/auth/usuarios (Solo Administradores)
router.post('/usuarios', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre_usuario, password, rol, nombre_completo } = req.body;

    if (!nombre_usuario || !password || !rol || !nombre_completo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    if (!['administrador', 'docente'].includes(rol)) {
      return res.status(400).json({ error: "El rol debe ser 'administrador' o 'docente'." });
    }

    const hashed = hashPassword(password);

    if (pgPool) {
      const exists = await pgPool.query('SELECT id_usuario FROM usuarios WHERE LOWER(nombre_usuario) = LOWER($1)', [nombre_usuario.trim()]);
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya se encuentra registrado.' });
      }

      const inserted = await pgPool.query(
        'INSERT INTO usuarios (nombre_usuario, password_hash, rol, nombre_completo) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre_usuario, rol, nombre_completo, creado_en',
        [nombre_usuario.trim(), hashed, rol, nombre_completo.trim()]
      );
      return res.status(201).json(inserted.rows[0]);
    } else {
      const db = loadLocalDB();
      const exists = db.usuarios.some(u => u.nombre_usuario.toLowerCase() === nombre_usuario.trim().toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'El nombre de usuario ya se encuentra registrado.' });
      }

      const nextId = db.usuarios.length > 0 ? Math.max(...db.usuarios.map(u => u.id_usuario)) + 1 : 1;
      const newUser: Usuario = {
        id_usuario: nextId,
        nombre_usuario: nombre_usuario.trim(),
        password_hash: hashed,
        rol,
        nombre_completo: nombre_completo.trim(),
        creado_en: new Date().toISOString()
      };
      db.usuarios.push(newUser);
      saveLocalDB(db);

      const { password_hash, ...safe } = newUser;
      return res.status(201).json(safe);
    }
  } catch (err: any) {
    console.error('Error al crear usuario:', err);
    return res.status(500).json({ error: 'Error al registrar el nuevo usuario.' });
  }
});

// POST /api/auth/cambiar-password
router.post('/cambiar-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Debe ingresar la contraseña actual y la nueva contraseña.' });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const userId = req.user!.id_usuario;

    if (pgPool) {
      const userRes = await pgPool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
      
      const user = userRes.rows[0];
      if (!verifyPassword(password_actual, user.password_hash)) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
      }

      const newHash = hashPassword(password_nueva);
      await pgPool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [newHash, userId]);
      return res.json({ message: 'Contraseña actualizada correctamente.' });
    } else {
      const db = loadLocalDB();
      const user = db.usuarios.find(u => u.id_usuario === userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

      if (!verifyPassword(password_actual, user.password_hash)) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
      }

      user.password_hash = hashPassword(password_nueva);
      saveLocalDB(db);
      return res.json({ message: 'Contraseña actualizada correctamente.' });
    }
  } catch (err: any) {
    console.error('Error al cambiar contraseña:', err);
    return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
  }
});

export default router;
