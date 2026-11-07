/**
 * AsisTrack Client API Service
 * Handles authenticated fetch requests, JWT storage, and typed endpoints.
 */

const TOKEN_KEY = 'asistrack_auth_token';
const USER_KEY = 'asistrack_auth_user';

export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  rol: 'administrador' | 'docente';
  nombre_completo: string;
  creado_en?: string;
}

export interface Curso {
  id_curso: number;
  anio: string;
  division: string;
  turno: 'Mañana' | 'Tarde' | 'Vespertino';
  total_estudiantes?: number;
  total_activos?: number;
}

export interface Estudiante {
  id_estudiante: number;
  dni: string;
  apellido: string;
  nombre: string;
  id_curso: number;
  estado: 'activo' | 'inactivo';
  anio?: string;
  division?: string;
  turno?: string;
  creado_en?: string;
}

export interface PlanillaItem {
  id_estudiante: number;
  dni: string;
  apellido: string;
  nombre: string;
  estado_estudiante: string;
  id_asistencia: number | null;
  fecha: string;
  jornada: string;
  estado: 'P' | 'A' | 'T' | 'AJ';
  observacion: string;
  id_usuario: number | null;
  registrado_por: string | null;
}

export interface HistorialResumen {
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificadas: number;
  porcentajeAsistencia: number;
  porcentajeInasistencia: number;
}

export interface DashboardKPIs {
  totalEstudiantes: number;
  totalActivos: number;
  totalInactivos: number;
  totalCursos: number;
  porcentajeAsistencia: number;
  porcentajeInasistencia: number;
  totalAsistenciasRegistradas: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificadas: number;
  hoy: {
    fecha: string;
    total: number;
    presentes: number;
    ausentes: number;
  };
}

export interface DashboardData {
  kpis: DashboardKPIs;
  estudiantesConMasAusencias: Array<{
    id_estudiante: number;
    dni: string;
    apellido: string;
    nombre: string;
    anio: string;
    division: string;
    total_ausencias: number;
  }>;
  comparacionCursos: Array<{
    id_curso: number;
    nombre_curso: string;
    total_estudiantes: number;
    total_registros: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    justificadas: number;
    porcentaje_asistencia: number;
  }>;
}

// Token management
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: Usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Core fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
      clearStoredSession();
      window.dispatchEvent(new Event('asistrack-auth-expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(nombre_usuario: string, password: string) {
    const data = await apiFetch<{ message: string; token: string; usuario: Usuario }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombre_usuario, password })
    });
    setStoredSession(data.token, data.usuario);
    return data;
  },

  async me() {
    return apiFetch<{ usuario: Usuario }>('/api/auth/me');
  },

  async getUsuarios() {
    return apiFetch<Usuario[]>('/api/auth/usuarios');
  },

  async createUsuario(data: { nombre_usuario: string; password: string; rol: string; nombre_completo: string }) {
    return apiFetch<Usuario>('/api/auth/usuarios', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async cambiarPassword(password_actual: string, password_nueva: string) {
    return apiFetch<{ message: string }>('/api/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ password_actual, password_nueva })
    });
  },

  // Cursos
  async getCursos() {
    return apiFetch<Curso[]>('/api/cursos');
  },

  async createCurso(data: { anio: string; division: string; turno: string }) {
    return apiFetch<Curso>('/api/cursos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCurso(id: number, data: { anio: string; division: string; turno: string }) {
    return apiFetch<Curso>(`/api/cursos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteCurso(id: number) {
    return apiFetch<{ message: string }>(`/api/cursos/${id}`, {
      method: 'DELETE'
    });
  },

  // Estudiantes
  async getEstudiantes(params?: { id_curso?: number | string; search?: string; estado?: string }) {
    const q = new URLSearchParams();
    if (params?.id_curso) q.set('id_curso', String(params.id_curso));
    if (params?.search) q.set('search', params.search);
    if (params?.estado) q.set('estado', params.estado);
    const query = q.toString() ? `?${q.toString()}` : '';
    return apiFetch<Estudiante[]>(`/api/estudiantes${query}`);
  },

  async getEstudiante(id: number) {
    return apiFetch<Estudiante>(`/api/estudiantes/${id}`);
  },

  async createEstudiante(data: { dni: string; apellido: string; nombre: string; id_curso: number; estado?: string }) {
    return apiFetch<Estudiante>('/api/estudiantes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEstudiante(id: number, data: { dni: string; apellido: string; nombre: string; id_curso: number; estado?: string }) {
    return apiFetch<Estudiante>(`/api/estudiantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleEstadoEstudiante(id: number, estado: 'activo' | 'inactivo') {
    return apiFetch<Estudiante>(`/api/estudiantes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado })
    });
  },

  async deleteEstudiante(id: number) {
    return apiFetch<{ message: string }>(`/api/estudiantes/${id}`, {
      method: 'DELETE'
    });
  },

  // Asistencias
  async getPlanilla(id_curso: number, fecha: string, jornada: string) {
    const q = new URLSearchParams({
      id_curso: String(id_curso),
      fecha,
      jornada
    });
    return apiFetch<PlanillaItem[]>(`/api/asistencias/planilla?${q.toString()}`);
  },

  async guardarLoteAsistencias(data: {
    fecha: string;
    jornada: string;
    registros: Array<{ id_estudiante: number; estado: string; observacion?: string }>;
  }) {
    return apiFetch<{ message: string; total: number; fecha: string; jornada: string }>('/api/asistencias/guardar-lote', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Historial
  async getHistorialEstudiante(id: number) {
    return apiFetch<{
      estudiante: Estudiante;
      resumen: HistorialResumen;
      registros: Array<{
        id_asistencia: number;
        fecha: string;
        jornada: string;
        estado: 'P' | 'A' | 'T' | 'AJ';
        observacion: string | null;
        registrado_por: string;
      }>;
    }>(`/api/historial/estudiante/${id}`);
  },

  async getHistorialResumen(params: {
    id_curso?: number | string;
    fecha_inicio?: string;
    fecha_fin?: string;
    mes?: number | string;
    anio?: number | string;
  }) {
    const q = new URLSearchParams();
    if (params.id_curso) q.set('id_curso', String(params.id_curso));
    if (params.fecha_inicio) q.set('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) q.set('fecha_fin', params.fecha_fin);
    if (params.mes) q.set('mes', String(params.mes));
    if (params.anio) q.set('anio', String(params.anio));
    return apiFetch<{
      resumen: HistorialResumen;
      registros: any[];
    }>(`/api/historial/resumen?${q.toString()}`);
  },

  // Estadísticas
  async getDashboardEstadisticas() {
    return apiFetch<DashboardData>('/api/estadisticas/dashboard');
  },

  // Informes
  async getInformeDatos(params: {
    id_curso?: number | string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
  }) {
    const q = new URLSearchParams();
    if (params.id_curso) q.set('id_curso', String(params.id_curso));
    if (params.fecha_desde) q.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) q.set('fecha_hasta', params.fecha_hasta);
    if (params.estado) q.set('estado', params.estado);
    return apiFetch<any[]>(`/api/informes/datos?${q.toString()}`);
  },

  getExportarCsvUrl(params: {
    id_curso?: number | string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
  }) {
    const q = new URLSearchParams();
    if (params.id_curso) q.set('id_curso', String(params.id_curso));
    if (params.fecha_desde) q.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) q.set('fecha_hasta', params.fecha_hasta);
    if (params.estado) q.set('estado', params.estado);
    const token = getStoredToken();
    if (token) q.set('token', token);
    return `/api/informes/exportar-csv?${q.toString()}`;
  },

  async descargarCsv(params: {
    id_curso?: number | string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
  }) {
    const q = new URLSearchParams();
    if (params.id_curso) q.set('id_curso', String(params.id_curso));
    if (params.fecha_desde) q.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) q.set('fecha_hasta', params.fecha_hasta);
    if (params.estado) q.set('estado', params.estado);

    const token = getStoredToken();
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`/api/informes/exportar-csv?${q.toString()}`, { headers });
    if (!res.ok) throw new Error('Error al descargar el archivo CSV.');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistrack_reporte_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async getHealth() {
    return apiFetch<{ status: string; baseDeDatos: string }>('/api/health');
  }
};
