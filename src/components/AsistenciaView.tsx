import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Save,
  CheckCheck,
  User,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { api, Curso, PlanillaItem, Usuario } from '../services/api.ts';

interface AsistenciaViewProps {
  usuario: Usuario | null;
}

export const AsistenciaView: React.FC<AsistenciaViewProps> = ({ usuario }) => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<number | ''>('');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [jornada, setJornada] = useState<'Mañana' | 'Tarde' | 'Jornada Completa'>('Mañana');

  const [estudiantes, setEstudiantes] = useState<PlanillaItem[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loadingPlanilla, setLoadingPlanilla] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load available courses
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setLoadingCursos(true);
        const data = await api.getCursos();
        setCursos(data);
        if (data.length > 0) {
          setSelectedCursoId(data[0].id_curso);
          // Set matching shift if available
          if (data[0].turno === 'Tarde') setJornada('Tarde');
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Error al cargar cursos: ' + err.message });
      } finally {
        setLoadingCursos(false);
      }
    };
    fetchCursos();
  }, []);

  // Load planilla when course, date or jornada changes
  const cargarPlanilla = async () => {
    if (!selectedCursoId) return;
    try {
      setLoadingPlanilla(true);
      setStatusMessage(null);
      const data = await api.getPlanilla(Number(selectedCursoId), fecha, jornada);
      setEstudiantes(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error al cargar planilla: ' + err.message });
    } finally {
      setLoadingPlanilla(false);
    }
  };

  useEffect(() => {
    if (selectedCursoId) {
      cargarPlanilla();
    }
  }, [selectedCursoId, fecha, jornada]);

  // Handle single student attendance state change
  const handleEstadoChange = (id_estudiante: number, nuevoEstado: 'P' | 'A' | 'T' | 'AJ') => {
    setEstudiantes((prev) =>
      prev.map((item) =>
        item.id_estudiante === id_estudiante ? { ...item, estado: nuevoEstado } : item
      )
    );
  };

  // Handle observation change
  const handleObservacionChange = (id_estudiante: number, observacion: string) => {
    setEstudiantes((prev) =>
      prev.map((item) =>
        item.id_estudiante === id_estudiante ? { ...item, observacion } : item
      )
    );
  };

  // Bulk actions: Set all to Presente / Ausente
  const marcarTodos = (estado: 'P' | 'A' | 'T' | 'AJ') => {
    setEstudiantes((prev) =>
      prev.map((item) => ({ ...item, estado }))
    );
  };

  // Save batch attendance to PostgreSQL
  const handleGuardar = async () => {
    if (estudiantes.length === 0) return;
    try {
      setSaving(true);
      setStatusMessage(null);

      const registros = estudiantes.map((e) => ({
        id_estudiante: e.id_estudiante,
        estado: e.estado,
        observacion: e.observacion || undefined
      }));

      const res = await api.guardarLoteAsistencias({
        fecha,
        jornada,
        registros
      });

      setStatusMessage({
        type: 'success',
        text: `${res.message} Registrado por: ${usuario?.nombre_completo || 'Usuario actual'}`
      });

      // Reload to reflect persisted state and user who logged it
      cargarPlanilla();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error al guardar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const selectedCurso = cursos.find((c) => c.id_curso === Number(selectedCursoId));

  // Counts for current sheet
  const countP = estudiantes.filter((e) => e.estado === 'P').length;
  const countA = estudiantes.filter((e) => e.estado === 'A').length;
  const countT = estudiantes.filter((e) => e.estado === 'T').length;
  const countAJ = estudiantes.filter((e) => e.estado === 'AJ').length;

  return (
    <div className="space-y-6">
      {/* Title & Filter Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-sky-600" />
              <span>Toma y Control de Asistencia Diaria</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Seleccione el curso, fecha y jornada para cargar los alumnos activos y registrar su asistencia.
            </p>
          </div>

          {/* Unique constraint badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Restricción PostgreSQL UNIQUE activa (Estudiante + Fecha + Jornada)</span>
          </div>
        </div>

        {/* Filter Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Curso */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Curso / División
            </label>
            <select
              value={selectedCursoId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedCursoId(id);
                const cur = cursos.find((c) => c.id_curso === id);
                if (cur?.turno === 'Tarde') setJornada('Tarde');
                else if (cur?.turno === 'Mañana') setJornada('Mañana');
              }}
              disabled={loadingCursos}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {cursos.map((c) => (
                <option key={c.id_curso} value={c.id_curso}>
                  {c.anio} "{c.division}" — Turno {c.turno}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            />
          </div>

          {/* Jornada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jornada / Turno
            </label>
            <select
              value={jornada}
              onChange={(e) => setJornada(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Jornada Completa">Jornada Completa</option>
            </select>
          </div>

          {/* Action: Reload */}
          <div className="flex items-end">
            <button
              onClick={cargarPlanilla}
              disabled={loadingPlanilla}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPlanilla ? 'animate-spin' : ''}`} />
              <span>Actualizar Planilla</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Planilla Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Toolbar & Summary Counters */}
        <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-xs font-bold text-slate-700">
              Curso: <span className="text-sky-600">{selectedCurso?.anio} "{selectedCurso?.division}"</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-600 font-medium">
              Alumnos activos: <strong>{estudiantes.length}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">P: {countP}</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">A: {countA}</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">T: {countT}</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">AJ: {countAJ}</span>
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => marcarTodos('P')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Todos Presentes</span>
            </button>
            <button
              onClick={() => marcarTodos('A')}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Todos Ausentes</span>
            </button>
          </div>
        </div>

        {/* Students List Table */}
        {loadingPlanilla ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-sm font-semibold">Cargando nómina del curso...</p>
          </div>
        ) : estudiantes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron estudiantes activos asignados a este curso.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/75 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Estudiante (Apellido y Nombre)</th>
                  <th className="py-3.5 px-4 font-mono">DNI</th>
                  <th className="py-3.5 px-4 text-center">Estado de Asistencia</th>
                  <th className="py-3.5 px-4">Observaciones</th>
                  <th className="py-3.5 px-4 text-xs">Registro previo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {estudiantes.map((est, index) => (
                  <tr
                    key={est.id_estudiante}
                    className={`hover:bg-slate-50/80 transition ${
                      est.estado === 'A'
                        ? 'bg-rose-50/30'
                        : est.estado === 'T'
                        ? 'bg-amber-50/30'
                        : est.estado === 'AJ'
                        ? 'bg-sky-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {est.apellido}, {est.nombre}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {est.dni}
                    </td>

                    {/* Attendance State Selector Buttons */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                        {/* P: Presente */}
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(est.id_estudiante, 'P')}
                          title="P = Presente"
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            est.estado === 'P'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600 ring-offset-1'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          P
                        </button>

                        {/* A: Ausente */}
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(est.id_estudiante, 'A')}
                          title="A = Ausente"
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            est.estado === 'A'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600 ring-offset-1'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          A
                        </button>

                        {/* T: Tardanza */}
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(est.id_estudiante, 'T')}
                          title="T = Tardanza"
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            est.estado === 'T'
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-1'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          T
                        </button>

                        {/* AJ: Ausente Justificado */}
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(est.id_estudiante, 'AJ')}
                          title="AJ = Ausente Justificado"
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            est.estado === 'AJ'
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-600 ring-offset-1'
                              : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                          }`}
                        >
                          AJ
                        </button>
                      </div>
                    </td>

                    {/* Observación */}
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={est.observacion || ''}
                        onChange={(e) => handleObservacionChange(est.id_estudiante, e.target.value)}
                        placeholder="Opcional: motivo, certificado..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
                      />
                    </td>

                    {/* Previous User Log Info */}
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {est.registrado_por ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <User className="w-3 h-3 text-sky-600 shrink-0" />
                          <span className="truncate max-w-[120px]">{est.registrado_por}</span>
                        </div>
                      ) : (
                        <span className="italic text-[11px]">Sin registrar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-300">
            <span>Usuario autenticado: </span>
            <strong className="text-sky-400">{usuario?.nombre_completo || 'Docente'}</strong>
            <span className="mx-2">•</span>
            <span>El registro se asociará con su identificador en PostgreSQL.</span>
          </div>

          <button
            onClick={handleGuardar}
            disabled={saving || estudiantes.length === 0}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando en PostgreSQL...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Asistencia del Curso</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
