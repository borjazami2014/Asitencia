import React, { useState } from 'react';
import { api, Usuario } from '../services/api.ts';
import { School, Lock, User, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombreUsuario || !password) {
      setError('Por favor complete ambos campos.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(nombreUsuario, password);
      onLoginSuccess(res.usuario);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setNombreUsuario(user);
    setPassword(pass);
    setError(null);
    try {
      setLoading(true);
      const res = await api.login(user, pass);
      onLoginSuccess(res.usuario);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-xl shadow-sky-500/25 text-white mb-4">
            <School className="w-9 h-9" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black text-white tracking-tight">Asis</span>
            <span className="text-3xl font-black text-sky-400 tracking-tight">Track</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Sistema de Gestión de Asistencia Escolar
          </p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
            Trabajo Práctico Integrador • Programación III
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Ingrese sus credenciales para acceder a la plataforma.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="ej. admin o docente"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/30 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Acceso Rápido para Demostración
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                disabled={loading}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-sky-100 bg-sky-50/70 hover:bg-sky-100/70 text-sky-900 text-left transition group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-sky-500 text-white shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Administrador</p>
                  <p className="text-[10px] text-sky-700 font-mono">admin / admin123</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('docente', 'docente123')}
                disabled={loading}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 text-left transition group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500 text-white shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Docente</p>
                  <p className="text-[10px] text-indigo-700 font-mono">docente / docente123</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            Contraseñas con bcrypt
          </span>
          <span>•</span>
          <span>PostgreSQL</span>
          <span>•</span>
          <span>Sesiones JWT</span>
        </div>
      </div>
    </div>
  );
};
