import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  Users,
  History,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  BookOpenCheck,
  LogOut,
  Menu,
  X,
  School
} from 'lucide-react';
import { Usuario } from '../services/api.ts';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  usuario: Usuario | null;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  usuario,
  onLogout,
  isOpen,
  setIsOpen
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'asistencia', label: 'Tomar Asistencia', icon: CalendarCheck },
    { id: 'cursos', label: 'Cursos y Divisiones', icon: GraduationCap },
    { id: 'estudiantes', label: 'Estudiantes', icon: Users },
    { id: 'historial', label: 'Historial de Asistencia', icon: History },
    { id: 'estadisticas', label: 'Estadísticas y Métricas', icon: BarChart3 },
    { id: 'informes', label: 'Informes y Exportar CSV', icon: FileSpreadsheet },
    ...(usuario?.rol === 'administrador'
      ? [{ id: 'usuarios', label: 'Usuarios y Seguridad', icon: ShieldCheck }]
      : []),
    { id: 'guia', label: 'Guía Render & GitHub', icon: BookOpenCheck }
  ];

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">Asis</span>
                <span className="text-xl font-black tracking-tight text-sky-400">Track</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Gestión Escolar
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Card */}
        {usuario && (
          <div className="mx-4 my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center border border-sky-400/30">
              {usuario.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {usuario.nombre_completo}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    usuario.rol === 'administrador' ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                />
                <span className="text-[11px] font-medium text-slate-300 capitalize">
                  {usuario.rol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Módulos del Sistema
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
          <div className="mt-3 text-center text-[10px] text-slate-400">
            Programación III • 6.º Año • PostgreSQL
          </div>
        </div>
      </aside>
    </>
  );
};

interface HeaderProps {
  usuario: Usuario | null;
  onOpenSidebar: () => void;
  currentTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ usuario, onOpenSidebar, currentTitle }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {currentTitle}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Sistema Web de Gestión y Control de Asistencia Escolar
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-sky-50 text-sky-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-sky-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PostgreSQL Activo</span>
        </div>
        {usuario && (
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block">
              {usuario.nombre_usuario}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block uppercase">
              {usuario.rol}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
