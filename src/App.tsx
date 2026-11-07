/**
 * AsisTrack - Sistema de Gestión de Asistencia Escolar
 * Trabajo Práctico Final Integrador - Programación III - 6.º Año
 */

import React, { useState, useEffect } from 'react';
import {
  api,
  Usuario,
  getStoredToken,
  getStoredUser,
  clearStoredSession
} from './services/api.ts';
import { Sidebar, Header } from './components/Sidebar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AsistenciaView } from './components/AsistenciaView.tsx';
import { CursosView } from './components/CursosView.tsx';
import { EstudiantesView } from './components/EstudiantesView.tsx';
import { HistorialView } from './components/HistorialView.tsx';
import { EstadisticasView } from './components/EstadisticasView.tsx';
import { InformesView } from './components/InformesView.tsx';
import { UsuariosView } from './components/UsuariosView.tsx';
import { GuiaRenderView } from './components/GuiaRenderView.tsx';

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.me()
        .then((res) => {
          setUsuario(res.usuario);
        })
        .catch(() => {
          clearStoredSession();
          setUsuario(null);
        });
    }

    const handleExpired = () => {
      setUsuario(null);
      setCurrentTab('dashboard');
    };

    window.addEventListener('asistrack-auth-expired', handleExpired);
    return () => window.removeEventListener('asistrack-auth-expired', handleExpired);
  }, []);

  const handleLoginSuccess = (user: Usuario) => {
    setUsuario(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    clearStoredSession();
    setUsuario(null);
    setCurrentTab('dashboard');
  };

  if (!usuario) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Panel de Control Escolar';
      case 'asistencia':
        return 'Toma y Registro de Asistencia';
      case 'cursos':
        return 'Cursos y Divisiones (1.º a 3.º Año)';
      case 'estudiantes':
        return 'Gestión de Estudiantes y Matrícula';
      case 'historial':
        return 'Historial y Auditoría de Asistencias';
      case 'estadisticas':
        return 'Estadísticas, Gráficos y Métricas';
      case 'informes':
        return 'Informes y Descarga de CSV';
      case 'usuarios':
        return 'Usuarios y Seguridad del Sistema';
      case 'guia':
        return 'Guía de Despliegue en Render y GitHub';
      default:
        return 'AsisTrack';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        usuario={usuario}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          usuario={usuario}
          onOpenSidebar={() => setSidebarOpen(true)}
          currentTitle={getTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'asistencia' && (
            <AsistenciaView usuario={usuario} />
          )}

          {currentTab === 'cursos' && (
            <CursosView
              usuario={usuario}
              onSelectCursoParaAsistencia={(_idCurso) => setCurrentTab('asistencia')}
            />
          )}

          {currentTab === 'estudiantes' && (
            <EstudiantesView
              usuario={usuario}
              onVerHistorialEstudiante={(_id) => setCurrentTab('historial')}
            />
          )}

          {currentTab === 'historial' && (
            <HistorialView onNavigateToInformes={() => setCurrentTab('informes')} />
          )}

          {currentTab === 'estadisticas' && (
            <EstadisticasView />
          )}

          {currentTab === 'informes' && (
            <InformesView />
          )}

          {currentTab === 'usuarios' && usuario.rol === 'administrador' && (
            <UsuariosView usuarioActual={usuario} />
          )}

          {currentTab === 'guia' && (
            <GuiaRenderView />
          )}
        </main>
      </div>
    </div>
  );
}
