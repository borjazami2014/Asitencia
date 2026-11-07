import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { api, DashboardData } from '../services/api.ts';

export const EstadisticasView: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardEstadisticas();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-2" />
        <p className="text-sm font-semibold">Generando gráficos y análisis estadístico...</p>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, comparacionCursos, estudiantesConMasAusencias } = data;
  const totalStates = (kpis.presentes + kpis.ausentes + kpis.tardanzas + kpis.justificadas) || 1;

  const pctP = Math.round((kpis.presentes / totalStates) * 100);
  const pctA = Math.round((kpis.ausentes / totalStates) * 100);
  const pctT = Math.round((kpis.tardanzas / totalStates) * 100);
  const pctAJ = Math.round((kpis.justificadas / totalStates) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            <span>Métricas y Gráficos Estadísticos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Análisis cuantitativo de presencialidad, ausentismo y desempeño comparativo por curso.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Global Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Asistencia Global
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">
              {kpis.porcentajeAsistencia}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(kpis.porcentajeAsistencia, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Inasistencia Global
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">
              {kpis.porcentajeInasistencia}%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: `${Math.min(kpis.porcentajeInasistencia, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Estudiantes Activos
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {kpis.totalActivos}
            </span>
            <span className="text-xs text-slate-500 font-medium">de {kpis.totalEstudiantes}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Matrícula vigente en el colegio</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Registros Procesados
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-600">
              {kpis.totalAsistenciasRegistradas}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Asistencias guardadas en PostgreSQL</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Comparison Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Desempeño Comparativo de Asistencia por Curso
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Porcentaje acumulado por división (1.º A a 3.º C)
            </p>

            <div className="space-y-4">
              {comparacionCursos.map((c) => (
                <div key={c.id_curso}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">{c.nombre_curso}</span>
                    <span
                      className={
                        c.porcentaje_asistencia >= 85
                          ? 'text-emerald-600'
                          : c.porcentaje_asistencia >= 75
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }
                    >
                      {c.porcentaje_asistencia}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        c.porcentaje_asistencia >= 85
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : c.porcentaje_asistencia >= 75
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500 to-red-400'
                      }`}
                      style={{ width: `${Math.min(c.porcentaje_asistencia, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Óptimo (&ge; 85%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Regular (75-84%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Riesgo (&lt; 75%)
            </span>
          </div>
        </div>

        {/* State Breakdown Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Distribución Proporcional de Estados (P, A, T, AJ)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Participación relativa sobre los {totalStates} registros en el sistema
            </p>

            {/* Stacked Percentage Bar */}
            <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-inner mb-6">
              <div
                className="bg-emerald-500 hover:opacity-90 transition flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${pctP}%` }}
                title={`Presente: ${pctP}%`}
              >
                {pctP > 8 ? `${pctP}%` : ''}
              </div>
              <div
                className="bg-rose-500 hover:opacity-90 transition flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${pctA}%` }}
                title={`Ausente: ${pctA}%`}
              >
                {pctA > 8 ? `${pctA}%` : ''}
              </div>
              <div
                className="bg-amber-400 hover:opacity-90 transition flex items-center justify-center text-[10px] font-bold text-slate-900"
                style={{ width: `${pctT}%` }}
                title={`Tardanza: ${pctT}%`}
              >
                {pctT > 8 ? `${pctT}%` : ''}
              </div>
              <div
                className="bg-sky-500 hover:opacity-90 transition flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${pctAJ}%` }}
                title={`Justificada: ${pctAJ}%`}
              >
                {pctAJ > 8 ? `${pctAJ}%` : ''}
              </div>
            </div>

            {/* Legend Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">P: Presente</span>
                  <span className="text-xs text-slate-500">{kpis.presentes} asistencias</span>
                </div>
                <span className="text-base font-black text-emerald-700">{pctP}%</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-rose-800 block">A: Ausente</span>
                  <span className="text-xs text-slate-500">{kpis.ausentes} inasistencias</span>
                </div>
                <span className="text-base font-black text-rose-700">{pctA}%</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">T: Tardanza</span>
                  <span className="text-xs text-slate-500">{kpis.tardanzas} ingresos tarde</span>
                </div>
                <span className="text-base font-black text-amber-700">{pctT}%</span>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-800 block">AJ: Justificada</span>
                  <span className="text-xs text-slate-500">{kpis.justificadas} con certificado</span>
                </div>
                <span className="text-base font-black text-sky-700">{pctAJ}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Cálculo ponderado en tiempo real según normativa de Educación Secundaria
          </div>
        </div>
      </div>

      {/* Top 5 Students with Most Absences Alert Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Estudiantes con Mayor Cantidad de Inasistencias (Alerta de Reincorporación)
            </h3>
            <p className="text-xs text-slate-500">
              Alumnos en seguimiento por acumulación de faltas injustificadas
            </p>
          </div>
        </div>

        {estudiantesConMasAusencias.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se registran alumnos con ausencias acumuladas.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Puesto</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4 font-mono">DNI</th>
                  <th className="py-3 px-4">Curso / División</th>
                  <th className="py-3 px-4 text-center">Total Inasistencias</th>
                  <th className="py-3 px-4 text-center">Nivel de Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {estudiantesConMasAusencias.map((est, i) => (
                  <tr key={est.id_estudiante} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">
                      #{i + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {est.apellido}, {est.nombre}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {est.dni}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      {est.anio} "{est.division}"
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                        {est.total_ausencias} {est.total_ausencias === 1 ? 'falta' : 'faltas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          est.total_ausencias >= 5
                            ? 'bg-rose-100 text-rose-800'
                            : est.total_ausencias >= 3
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {est.total_ausencias >= 5 ? 'Crítico (Aviso a Padres)' : 'Atención Requerida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
