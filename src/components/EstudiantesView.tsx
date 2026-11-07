import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';
import { api, Estudiante, Curso, Usuario } from '../services/api.ts';

interface EstudiantesViewProps {
  usuario: Usuario | null;
  onVerHistorialEstudiante?: (idEstudiante: number) => void;
}

export const EstudiantesView: React.FC<EstudiantesViewProps> = ({
  usuario,
  onVerHistorialEstudiante
}) => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCursoFilter, setSelectedCursoFilter] = useState<string>('todos');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>('todos');

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal New/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Estudiante | null>(null);
  const [formData, setFormData] = useState({
    dni: '',
    apellido: '',
    nombre: '',
    id_curso: 1,
    estado: 'activo'
  });
  const [submitting, setSubmitting] = useState(false);

  // Quick Attendance Preview Modal
  const [previewStudent, setPreviewStudent] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [estData, curData] = await Promise.all([
        api.getEstudiantes({
          id_curso: selectedCursoFilter !== 'todos' ? selectedCursoFilter : undefined,
          search: searchTerm || undefined,
          estado: selectedEstadoFilter !== 'todos' ? selectedEstadoFilter : undefined
        }),
        api.getCursos()
      ]);
      setEstudiantes(estData);
      setCursos(curData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCursoFilter, selectedEstadoFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      dni: '',
      apellido: '',
      nombre: '',
      id_curso: cursos[0]?.id_curso || 1,
      estado: 'activo'
    });
    setShowModal(true);
  };

  const openEditModal = (est: Estudiante) => {
    setEditingStudent(est);
    setFormData({
      dni: est.dni,
      apellido: est.apellido,
      nombre: est.nombre,
      id_curso: est.id_curso,
      estado: est.estado
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (editingStudent) {
        await api.updateEstudiante(editingStudent.id_estudiante, formData);
        setSuccess('Estudiante modificado correctamente.');
      } else {
        await api.createEstudiante(formData);
        setSuccess('Estudiante registrado exitosamente en PostgreSQL.');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar estudiante.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async (id: number, currentEstado: 'activo' | 'inactivo') => {
    const nuevoEstado = currentEstado === 'activo' ? 'inactivo' : 'activo';
    const actionLabel = nuevoEstado === 'inactivo' ? 'dar de baja lógica' : 'reactivar';
    if (!confirm(`¿Confirma ${actionLabel} a este estudiante?`)) return;

    try {
      setError(null);
      await api.toggleEstadoEstudiante(id, nuevoEstado);
      setSuccess(`Estado actualizado a ${nuevoEstado}.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al modificar estado.');
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar definitivamente a ${nombre}? Se eliminarán todas sus asistencias registradas.`)) return;

    try {
      setError(null);
      await api.deleteEstudiante(id);
      setSuccess('Estudiante eliminado.');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar estudiante.');
    }
  };

  const handleVerFicha = async (id: number) => {
    try {
      setLoadingPreview(true);
      const data = await api.getHistorialEstudiante(id);
      setPreviewStudent(data);
    } catch (err: any) {
      setError('Error al cargar ficha de estudiante: ' + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Módulo de Estudiantes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro, edición, control de estado y búsqueda por DNI o Apellido.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-600/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Estudiante</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por DNI, Nombre o Apellido (ej. José Pérez)..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Curso */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCursoFilter}
            onChange={(e) => setSelectedCursoFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="todos">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>
                {c.anio} "{c.division}" ({c.turno})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Estado */}
        <div>
          <select
            value={selectedEstadoFilter}
            onChange={(e) => setSelectedEstadoFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Solo Activos</option>
            <option value="inactivo">Solo Inactivos (Bajas)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-semibold">
            Buscando estudiantes en la base de datos...
          </div>
        ) : estudiantes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron estudiantes con los criterios de búsqueda aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-mono">DNI</th>
                  <th className="py-3.5 px-4">Apellido y Nombre</th>
                  <th className="py-3.5 px-4">Año y División</th>
                  <th className="py-3.5 px-4">Turno</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {estudiantes.map((est) => (
                  <tr key={est.id_estudiante} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {est.dni}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {est.apellido}, {est.nombre}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-sky-800 text-xs font-bold">
                        {est.anio} "{est.division}"
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {est.turno}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          est.estado === 'activo'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            est.estado === 'activo' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {est.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Ficha / Historial */}
                        <button
                          onClick={() => handleVerFicha(est.id_estudiante)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Ver Ficha y Estadísticas del Estudiante"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => openEditModal(est)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar datos"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Toggle Estado (Baja / Alta) */}
                        <button
                          onClick={() => handleToggleEstado(est.id_estudiante, est.estado)}
                          className={`p-1.5 rounded-lg transition ${
                            est.estado === 'activo'
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={est.estado === 'activo' ? 'Dar de baja lógica' : 'Reactivar estudiante'}
                        >
                          {est.estado === 'activo' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>

                        {/* Eliminar (Admin) */}
                        {usuario?.rol === 'administrador' && (
                          <button
                            onClick={() => handleDelete(est.id_estudiante, `${est.apellido} ${est.nombre}`)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar / Editar Estudiante */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Editar Estudiante' : 'Registrar Nuevo Estudiante'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  DNI (Documento Nacional de Identidad)
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                  placeholder="Número de 7 u 8 dígitos"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Restricción UNIQUE: el sistema rechaza DNIs duplicados.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder="ej. Gómez"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="ej. Mateo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Curso Asignado
                </label>
                <select
                  value={formData.id_curso}
                  onChange={(e) => setFormData({ ...formData, id_curso: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  {cursos.map((c) => (
                    <option key={c.id_curso} value={c.id_curso}>
                      {c.anio} "{c.division}" — Turno {c.turno}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estado Inicial
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="activo">Activo (Matriculado)</option>
                  <option value="inactivo">Inactivo (Dado de baja)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/25 disabled:opacity-50"
                >
                  {submitting ? 'Guardando en PostgreSQL...' : editingStudent ? 'Guardar Cambios' : 'Registrar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha del Estudiante */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ficha de Asistencia Individual
                </h3>
                <p className="text-xs text-slate-500">
                  {previewStudent.estudiante.apellido}, {previewStudent.estudiante.nombre} (DNI: {previewStudent.estudiante.dni})
                </p>
              </div>
              <button
                onClick={() => setPreviewStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Resumen Pills */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block">P</span>
                  <span className="text-lg font-black text-emerald-900">{previewStudent.resumen.presentes}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 block">A</span>
                  <span className="text-lg font-black text-rose-900">{previewStudent.resumen.ausentes}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 block">T</span>
                  <span className="text-lg font-black text-amber-900">{previewStudent.resumen.tardanzas}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-700 block">AJ</span>
                  <span className="text-lg font-black text-sky-900">{previewStudent.resumen.justificadas}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Tasa Global de Asistencia:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {previewStudent.resumen.porcentajeAsistencia}%
                </span>
              </div>

              {/* Attendance Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Historial de Registros ({previewStudent.registros.length})
                </h4>
                {previewStudent.registros.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Sin asistencias registradas aún.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Jornada</th>
                          <th className="py-2 px-3 text-center">Estado</th>
                          <th className="py-2 px-3">Observación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {previewStudent.registros.map((r: any) => (
                          <tr key={r.id_asistencia}>
                            <td className="py-2 px-3 font-mono">{r.fecha}</td>
                            <td className="py-2 px-3">{r.jornada}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                  r.estado === 'P'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : r.estado === 'A'
                                    ? 'bg-rose-100 text-rose-800'
                                    : r.estado === 'T'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {r.estado}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 italic">{r.observacion || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setPreviewStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
