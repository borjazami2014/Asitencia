import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  User,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { api, Usuario } from '../services/api.ts';

interface UsuariosViewProps {
  usuarioActual: Usuario | null;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({ usuarioActual }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    nombre_usuario: '',
    password: '',
    rol: 'docente',
    nombre_completo: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Change Password Form State
  const [passData, setPassData] = useState({
    password_actual: '',
    password_nueva: '',
    password_confirmar: ''
  });
  const [changingPass, setChangingPass] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      setError(null);
      await api.createUsuario(newUser);
      setSuccess(`Usuario ${newUser.nombre_usuario} creado con éxito y contraseña encriptada con bcrypt.`);
      setNewUser({
        nombre_usuario: '',
        password: '',
        rol: 'docente',
        nombre_completo: ''
      });
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.password_nueva !== passData.password_confirmar) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    try {
      setChangingPass(true);
      setError(null);
      const res = await api.cambiarPassword(passData.password_actual, passData.password_nueva);
      setSuccess(res.message);
      setPassData({ password_actual: '', password_nueva: '', password_confirmar: '' });
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-sky-600" />
          <span>Gestión de Usuarios, Roles y Seguridad</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Administración de cuentas con hash bcrypt, control de roles (Administrador / Docente) y sesiones JWT.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid: Users List and Create Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Usuarios Registrados en el Sistema ({usuarios.length})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Cargando usuarios...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Nombre Completo</th>
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Rol</th>
                    <th className="py-2.5 px-3">Seguridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usuarios.map((u) => (
                    <tr key={u.id_usuario} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{u.id_usuario}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{u.nombre_completo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.nombre_usuario}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                            u.rol === 'administrador'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span className="capitalize">{u.rol}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        bcrypt (10 rondas)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Form (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-sky-600" />
            Nuevo Usuario
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Crea una cuenta para un docente o directivo.
          </p>

          <form onSubmit={handleCreateUser} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={newUser.nombre_completo}
                onChange={(e) => setNewUser({ ...newUser, nombre_completo: e.target.value })}
                placeholder="ej. Prof. Carlos Méndez"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de Usuario</label>
              <input
                type="text"
                value={newUser.nombre_usuario}
                onChange={(e) => setNewUser({ ...newUser, nombre_usuario: e.target.value })}
                placeholder="ej. cmendez"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
              <select
                value={newUser.rol}
                onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <option value="docente">Docente</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creatingUser}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-600/25 disabled:opacity-50 cursor-pointer"
            >
              {creatingUser ? 'Registrando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-xl">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-sky-600" />
          Cambiar Mi Contraseña
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Actualice su clave de acceso para el usuario actual ({usuarioActual?.nombre_usuario}).
        </p>

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Actual</label>
            <input
              type="password"
              value={passData.password_actual}
              onChange={(e) => setPassData({ ...passData, password_actual: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={passData.password_nueva}
                onChange={(e) => setPassData({ ...passData, password_nueva: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={passData.password_confirmar}
                onChange={(e) => setPassData({ ...passData, password_confirmar: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            {changingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};
