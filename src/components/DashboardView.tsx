import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api, DashboardData } from '../services/api.ts';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardEstadisticas();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-3" />
        <p className="text-sm font-medium">Cargando métricas y estadísticas escolares...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <p className="font-bold">Error al cargar datos del panel:</p>
        <p className="text-sm mt-1">{error || 'Sin datos disponibles'}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { kpis, estudiantesConMasAusencias, comparacionCursos } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Panel de Control Escolar en Tiempo Real
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bienvenido a AsisTrack
          </h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Gestión integral de asistencia, seguimiento por divisiones y reportes académicos para 6.º año de Programación III.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigate('asistencia')}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-500/25 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Tomar Asistencia Hoy</span>
            </button>
            <button
              onClick={() => onNavigate('informes')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/10 cursor-pointer"
            >
              <span>Generar Informe CSV</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Estudiantes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estudiantes
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.totalEstudiantes}
            </span>
            <span className="text-xs text-slate-500 ml-2">totales</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {kpis.totalActivos} activos
            </span>
            <span>•</span>
            <span className="text-slate-600">{kpis.totalInactivos} de baja</span>
          </div>
        </div>

        {/* Porcentaje Asistencia */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tasa Asistencia
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {kpis.porcentajeAsistencia}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Presentes + Tardanzas sobre total</span>
          </div>
        </div>

        {/* Porcentaje Inasistencia */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inasistencia Global
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {kpis.porcentajeInasistencia}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-rose-600">{kpis.ausentes}</span>
            <span>ausencias no justificadas</span>
          </div>
        </div>

        {/* Cursos Registrados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cursos y Divisiones
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis.totalCursos}
            </span>
            <span className="text-xs text-slate-500 ml-2">divisiones</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>1.º, 2.º y 3.º año (A, B, C)</span>
          </div>
        </div>
      </div>

      {/* Attendance Distribution Status Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Desglose General de Estados Registrados
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Presentes (P)</span>
            </div>
            <p className="text-2xl font-black text-emerald-900">{kpis.presentes}</p>
            <p className="text-[11px] text-emerald-700 mt-1">Asistencias puntuales</p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100">
            <div className="flex items-center gap-2 text-rose-700 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Ausentes (A)</span>
            </div>
            <p className="text-2xl font-black text-rose-900">{kpis.ausentes}</p>
            <p className="text-[11px] text-rose-700 mt-1">Faltas sin justificar</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Tardanzas (T)</span>
            </div>
            <p className="text-2xl font-black text-amber-900">{kpis.tardanzas}</p>
            <p className="text-[11px] text-amber-700 mt-1">Ingresos fuera de hora</p>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100">
            <div className="flex items-center gap-2 text-sky-700 mb-1">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Justificadas (AJ)</span>
            </div>
            <p className="text-2xl font-black text-sky-900">{kpis.justificadas}</p>
            <p className="text-[11px] text-sky-700 mt-1">Con certificado o aviso</p>
          </div>
        </div>
      </div>

      {/* Two Columns: Comparative Courses & High Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Comparison (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Comparación de Asistencia entre Cursos
              </h3>
              <p className="text-xs text-slate-500">
                Porcentaje de asistencia acumulado por división
              </p>
            </div>
            <button
              onClick={() => onNavigate('cursos')}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {comparacionCursos.map((c) => (
              <div key={c.id_curso} className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 transition border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800">
                    {c.nombre_curso}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px]">
                      {c.total_estudiantes} estudiantes
                    </span>
                    <span
                      className={`font-black ${
                        c.porcentaje_asistencia >= 85
                          ? 'text-emerald-600'
                          : c.porcentaje_asistencia >= 75
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {c.porcentaje_asistencia}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      c.porcentaje_asistencia >= 85
                        ? 'bg-emerald-500'
                        : c.porcentaje_asistencia >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(c.porcentaje_asistencia, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Absences / Risk Panel (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Estudiantes con más Ausencias
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Alumnos con mayor cantidad de inasistencias sin justificar
            </p>

            {estudiantesConMasAusencias.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay ausencias críticas registradas en el sistema.
              </div>
            ) : (
              <div className="space-y-3">
                {estudiantesConMasAusencias.map((est, idx) => (
                  <div
                    key={est.id_estudiante}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {est.apellido}, {est.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          DNI: {est.dni} • {est.anio} "{est.division}"
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                        {est.total_ausencias} {est.total_ausencias === 1 ? 'falta' : 'faltas'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('estudiantes')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-center cursor-pointer"
            >
              Ver nómina completa de estudiantes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
