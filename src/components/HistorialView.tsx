import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  RefreshCw,
  User
} from 'lucide-react';
import { api, Curso, HistorialResumen } from '../services/api.ts';

interface HistorialViewProps {
  onNavigateToInformes?: () => void;
}

export const HistorialView: React.FC<HistorialViewProps> = ({ onNavigateToInformes }) => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [selectedMes, setSelectedMes] = useState<string>('');

  // Results
  const [resumen, setResumen] = useState<HistorialResumen>({
    total: 0,
    presentes: 0,
    ausentes: 0,
    tardanzas: 0,
    justificadas: 0,
    porcentajeAsistencia: 0,
    porcentajeInasistencia: 0
  });
  const [registros, setRegistros] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const cData = await api.getCursos();
        setCursos(cData);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const res = await api.getHistorialResumen({
        id_curso: selectedCurso || undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        mes: selectedMes || undefined
      });
      setResumen(res.resumen);
      setRegistros(res.registros);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [selectedCurso, fechaInicio, fechaFin, selectedMes]);

  const handleLimpiarFiltros = () => {
    setSelectedCurso('');
    setFechaInicio('');
    setFechaFin('');
    setSelectedMes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-sky-600" />
            <span>Historial y Auditoría de Asistencias</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consulta cruzada de registros por fecha, curso, jornada y desglose de estados P / A / T / AJ.
          </p>
        </div>

        {onNavigateToInformes && (
          <button
            onClick={onNavigateToInformes}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ir a Exportación CSV</span>
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600" />
            Filtros de Búsqueda Histórica
          </span>
          <button
            onClick={handleLimpiarFiltros}
            className="text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Curso */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Curso / División
            </label>
            <select
              value={selectedCurso}
              onChange={(e) => setSelectedCurso(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">Todos los cursos</option>
              {cursos.map((c) => (
                <option key={c.id_curso} value={c.id_curso}>
                  {c.anio} "{c.division}" ({c.turno})
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            />
          </div>

          {/* Mes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Filtro Mensual
            </label>
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">Cualquier mes</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Registros
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {resumen.total}
          </span>
        </div>

        <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Presentes (P)
          </span>
          <span className="text-xl font-black text-emerald-900 mt-1 block">
            {resumen.presentes}
          </span>
        </div>

        <div className="bg-rose-50/70 rounded-xl p-4 border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Ausentes (A)
          </span>
          <span className="text-xl font-black text-rose-900 mt-1 block">
            {resumen.ausentes}
          </span>
        </div>

        <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Tardanzas (T)
          </span>
          <span className="text-xl font-black text-amber-900 mt-1 block">
            {resumen.tardanzas}
          </span>
        </div>

        <div className="bg-sky-50/70 rounded-xl p-4 border border-sky-100 shadow-xs">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Justificadas (AJ)
          </span>
          <span className="text-xl font-black text-sky-900 mt-1 block">
            {resumen.justificadas}
          </span>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
            % Asistencia
          </span>
          <span className="text-xl font-black text-white mt-1 block">
            {resumen.porcentajeAsistencia}%
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold text-sm">
            Consultando registros en PostgreSQL...
          </div>
        ) : registros.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron asistencias para el período y filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-mono">Fecha</th>
                  <th className="py-3.5 px-4">Jornada</th>
                  <th className="py-3.5 px-4">Curso</th>
                  <th className="py-3.5 px-4">Estudiante</th>
                  <th className="py-3.5 px-4 font-mono">DNI</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4">Observación</th>
                  <th className="py-3.5 px-4">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {registros.map((r: any) => (
                  <tr key={r.id_asistencia} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                      {r.fecha}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium">
                      {r.jornada}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-xs text-sky-800">
                      {r.anio} "{r.division}"
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.apellido}, {r.nombre}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {r.dni}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-black shadow-2xs ${
                          r.estado === 'P'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.estado === 'A'
                            ? 'bg-rose-100 text-rose-800'
                            : r.estado === 'T'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {r.estado === 'P'
                          ? 'Presente'
                          : r.estado === 'A'
                          ? 'Ausente'
                          : r.estado === 'T'
                          ? 'Tardanza'
                          : 'Justificado'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 italic max-w-xs truncate">
                      {r.observacion || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.registrado_por || 'Sistema'}</span>
                      </div>
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
