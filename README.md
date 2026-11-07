# AsisTrack – Sistema de Gestión de Asistencia Escolar

**Trabajo Práctico Final Integrador — Programación III (6.º Año)**

Sistema web completo y profesional para el registro, control, seguimiento estadístico y auditoría de asistencia de estudiantes en instituciones de educación secundaria. Desarrollado con arquitectura Full Stack: **HTML5, CSS3 (Tailwind CSS), TypeScript/JavaScript, Node.js, Express.js y PostgreSQL**.

---

## 🌟 Características Principales

1. **Autenticación y Seguridad**:
   - Inicio de sesión con usuario y contraseña.
   - Encriptación de contraseñas mediante **bcrypt** (10 rondas de salting).
   - Sesiones seguras mediante **JWT (JSON Web Tokens)**.
   - Control de acceso por roles: **Administrador / Director** y **Docente**.
   - Cuentas preconfiguradas para demostración inmediata:
     - Administrador: `admin` / `admin123`
     - Docente: `docente` / `docente123`

2. **Cursos y Divisiones**:
   - Cursos iniciales del colegio:
     - 1.º Año: Divisiones A, B y C (Turnos Mañana y Tarde).
     - 2.º Año: Divisiones A, B y C.
     - 3.º Año: Divisiones A, B y C.
   - Alta, edición, conteo en tiempo real de estudiantes matriculados y asignación de turnos (Mañana, Tarde, Vespertino).

3. **Gestión de Estudiantes**:
   - Datos: DNI, Apellido, Nombre, Curso (Año y División), Estado (Activo / Inactivo).
   - Validación estricta y restricción `UNIQUE` en PostgreSQL para evitar DNIs duplicados.
   - Filtros de búsqueda en tiempo real por DNI, por apellido y por curso.
   - Bajas lógicas (inactivación) y reactivación sin pérdida de datos históricos.
   - Ficha individual de estudiante con historial y tasa de presencialidad.

4. **Toma y Registro de Asistencia**:
   - Selector por Año, División, Fecha y Jornada (Mañana / Tarde / Jornada Completa).
   - Visualización de la nómina de estudiantes activos.
   - Botones con los 4 estados reglamentarios:
     - **P** = Presente (verde)
     - **A** = Ausente (rojo)
     - **T** = Tardanza (amarillo)
     - **AJ** = Ausente justificado (celeste)
   - Campo opcional de observación por cada estudiante.
   - Acciones masivas: "Todos Presentes", "Todos Ausentes".
   - **Restricción UNIQUE en PostgreSQL**: `UNIQUE(id_estudiante, fecha, jornada)` para prevenir duplicados.
   - Auditoría: se almacena y muestra el identificador del usuario que realizó el registro (`id_usuario`).

5. **Historial y Auditoría**:
   - Consultas cruzadas por estudiante, curso, fecha o rango mensual.
   - Contadores automáticos: Presentes, Ausentes, Tardanzas y Justificadas.
   - Cálculo del porcentaje de asistencia.

6. **Estadísticas y Métricas**:
   - Métricas globales en tiempo real.
   - **Estudiantes con más ausencias**: alerta temprana para alumnos con acumulación crítica de faltas.
   - **Comparación entre cursos**: barras comparativas de presencialidad entre divisiones.
   - Gráfico de distribución de estados (P, A, T, AJ).

7. **Informes y Exportación CSV**:
   - Filtros por fecha (desde/hasta), curso y estado.
   - Vista previa tabular antes de exportar.
   - Descarga directa en formato CSV con codificación **UTF-8 con BOM** para compatibilidad 100% con Microsoft Excel y hojas de cálculo.

---

## 🗄️ Esquema de Base de Datos PostgreSQL (`database.sql`)

El archivo `database.sql` contiene la estructura completa con claves primarias (`SERIAL PRIMARY KEY`), foráneas (`REFERENCES`) y restricciones `UNIQUE`:

- **`usuarios`**: `id_usuario`, `nombre_usuario`, `password_hash`, `rol`, `nombre_completo`, `creado_en`.
- **`cursos`**: `id_curso`, `anio`, `division`, `turno`, `CONSTRAINT uq_curso UNIQUE(anio, division, turno)`.
- **`estudiantes`**: `id_estudiante`, `dni`, `apellido`, `nombre`, `id_curso` (FK), `estado`, `creado_en`, `UNIQUE(dni)`.
- **`asistencias`**: `id_asistencia`, `id_estudiante` (FK), `fecha`, `jornada`, `estado`, `observacion`, `id_usuario` (FK), `creado_en`, `CONSTRAINT uq_asistencia_estudiante_fecha_jornada UNIQUE(id_estudiante, fecha, jornada)`.

---

## 🚀 Despliegue en Render con PostgreSQL

### Paso 1: Subir a GitHub
```bash
git init
git add .
git commit -m "Entrega AsisTrack - Sistema Escolar"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/asistrack.git
git push -u origin main
```

### Paso 2: Crear Blueprint en Render
1. Inicia sesión en [render.com](https://render.com).
2. Haz clic en **New +** y selecciona **Blueprint**.
3. Conecta tu repositorio de GitHub `asistrack`.
4. Render leerá el archivo `render.yaml` y creará automáticamente:
   - Base de datos PostgreSQL (`asistrack-db`).
   - Web Service Node.js (`asistrack-app`).
   - Configuración de la variable `DATABASE_URL` vinculada.

### Paso 3: Ejecutar Localmente
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en desarrollo
npm run dev

# 3. Compilar para producción
npm run build
npm start
```

---

## 👥 Credenciales de Prueba

- **Director / Administrador**:
  - Usuario: `admin`
  - Contraseña: `admin123`
- **Docente**:
  - Usuario: `docente`
  - Contraseña: `docente123`
