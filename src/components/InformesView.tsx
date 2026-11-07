import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Printer,
  Table
} from 'lucide-react';
import { api, Curso } from '../services/api.ts';

export const InformesView: React.FC = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');

  // Preview Data
  const [datos, setDatos] = useState<any[]>([]);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const cList = await api.getCursos();
        setCursos(cList);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCursos();
  }, []);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const res = await api.getInformeDatos({
        id_curso: selectedCurso || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        estado: selectedEstado !== 'todos' ? selectedEstado : undefined
      });
      setDatos(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [selectedCurso, fechaDesde, fechaHasta, selectedEstado]);

  const handleDescargarCsv = async () => {
    try {
      setDownloading(true);
      await api.descargarCsv({
        id_curso: selectedCurso || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        estado: selectedEstado !== 'todos' ? selectedEstado : undefined
      });
    } catch (err: any) {
      alert(err.message || 'Error al exportar archivo CSV.');
    } finally {
      setDownloading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Módulo de Informes y Exportación CSV</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generación de reportes de asistencia con filtros por rango de fechas, curso y exportación directa a Microsoft Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            onClick={handleDescargarCsv}
            disabled={downloading || datos.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
          >
            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Generando CSV...' : 'Exportar CSV (Excel)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-600" />
          Filtros de Exportación
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Estado de Asistencia
            </label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="P">Solo Presentes (P)</option>
              <option value="A">Solo Ausentes (A)</option>
              <option value="T">Solo Tardanzas (T)</option>
              <option value="AJ">Solo Justificadas (AJ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-slate-400" />
            Vista previa de datos a exportar ({datos.length} registros)
          </span>
          <span className="text-slate-500">
            Formato: CSV con codificación UTF-8 BOM para Microsoft Excel
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold text-sm">
            Generando vista previa de informe...
          </div>
        ) : datos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron asistencias que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Jornada</th>
                  <th className="py-2.5 px-3">Curso</th>
                  <th className="py-2.5 px-3 font-mono">DNI</th>
                  <th className="py-2.5 px-3">Estudiante</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3">Observaciones</th>
                  <th className="py-2.5 px-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {datos.map((d: any, index: number) => (
                  <tr key={d.id_asistencia || index} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.fecha}</td>
                    <td className="py-2.5 px-3">{d.jornada}</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-800">{d.anio} "{d.division}" ({d.turno})</td>
                    <td className="py-2.5 px-3 font-mono">{d.dni}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{d.apellido}, {d.nombre}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${
                          d.estado === 'P'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.estado === 'A'
                            ? 'bg-rose-100 text-rose-800'
                            : d.estado === 'T'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {d.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{d.observacion || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.registrado_por}</td>
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
