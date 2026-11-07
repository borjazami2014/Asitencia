import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Plus,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sun,
  Sunset,
  Moon,
  X
} from 'lucide-react';
import { api, Curso, Usuario } from '../services/api.ts';

interface CursosViewProps {
  usuario: Usuario | null;
  onSelectCursoParaAsistencia?: (idCurso: number) => void;
}

export const CursosView: React.FC<CursosViewProps> = ({ usuario, onSelectCursoParaAsistencia }) => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [formData, setFormData] = useState({
    anio: '1.º',
    division: 'A',
    turno: 'Mañana'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCursos();
      setCursos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cursos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const openCreateModal = () => {
    setEditingCurso(null);
    setFormData({ anio: '1.º', division: 'A', turno: 'Mañana' });
    setShowModal(true);
  };

  const openEditModal = (c: Curso) => {
    setEditingCurso(c);
    setFormData({ anio: c.anio, division: c.division, turno: c.turno });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (editingCurso) {
        await api.updateCurso(editingCurso.id_curso, formData);
        setSuccess('Curso actualizado correctamente.');
      } else {
        await api.createCurso(formData);
        setSuccess('Nuevo curso creado correctamente.');
      }
      setShowModal(false);
      fetchCursos();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el curso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, anio: string, division: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el curso ${anio} "${division}"?`)) return;
    try {
      setError(null);
      await api.deleteCurso(id);
      setSuccess('Curso eliminado exitosamente.');
      fetchCursos();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el curso.');
    }
  };

  const getTurnoIcon = (turno: string) => {
    if (turno === 'Mañana') return <Sun className="w-4 h-4 text-amber-500" />;
    if (turno === 'Tarde') return <Sunset className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-sky-600" />
            <span>Gestión de Cursos y Divisiones</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administración de años académicos, divisiones y asignación de turnos escolares.
          </p>
        </div>

        {usuario?.rol === 'administrador' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Curso</span>
          </button>
        )}
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

      {/* Cursos Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm font-semibold">
          Cargando cursos escolares...
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100 text-sm">
          No hay cursos registrados en el sistema.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursos.map((c) => (
            <div
              key={c.id_curso}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {c.anio} "{c.division}"
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                      {getTurnoIcon(c.turno)}
                      <span>Turno {c.turno}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 text-xs font-bold">
                    ID #{c.id_curso}
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Estudiantes matriculados:</span>
                  </div>
                  <span className="font-black text-slate-900">
                    {c.total_activos ?? c.total_estudiantes ?? 0} activos
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                {onSelectCursoParaAsistencia && (
                  <button
                    onClick={() => onSelectCursoParaAsistencia(c.id_curso)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                  >
                    Tomar asistencia →
                  </button>
                )}

                {usuario?.rol === 'administrador' && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      title="Editar curso"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id_curso, c.anio, c.division)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar curso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                {editingCurso ? 'Editar Curso' : 'Crear Nuevo Curso'}
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
                  Año Escolar
                </label>
                <select
                  value={formData.anio}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="1.º">1.º Año</option>
                  <option value="2.º">2.º Año</option>
                  <option value="3.º">3.º Año</option>
                  <option value="4.º">4.º Año</option>
                  <option value="5.º">5.º Año</option>
                  <option value="6.º">6.º Año</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  División
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value.toUpperCase() })}
                  placeholder="ej. A, B, C, D"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Turno
                </label>
                <select
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Vespertino">Vespertino</option>
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
                  {submitting ? 'Guardando...' : editingCurso ? 'Guardar Cambios' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
