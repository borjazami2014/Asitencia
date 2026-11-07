import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Copy,
  Terminal,
  Server,
  Database,
  Github,
  Globe,
  ExternalLink,
  Download
} from 'lucide-react';

export const GuiaRenderView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-sky-500 text-white shadow-lg">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Guía de Despliegue en Render y GitHub
            </h2>
            <p className="text-xs text-sky-200">
              Trabajo Práctico Final Integrador • Programación III • 6.º Año
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
          Este proyecto cuenta con todos los archivos de configuración requeridos para publicar en Render con base de datos PostgreSQL persistente, API REST en Express y frontend compilado en React.
        </p>
      </div>

      {/* Step by Step Cards */}
      <div className="space-y-6">
        {/* Paso 1: GitHub */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-900" />
                Subir el Proyecto a tu Repositorio de GitHub
              </h3>
              <p className="text-xs text-slate-500">
                Inicializa Git y sube todo el código fuente a tu cuenta de GitHub.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-200 space-y-2 relative">
            <button
              onClick={() =>
                copyCode(
                  `git init\ngit add .\ngit commit -m "Entrega AsisTrack - TP Final Integrador Programacion III"\ngit branch -M main\ngit remote add origin https://github.com/TU_USUARIO/asistrack.git\ngit push -u origin main`,
                  1
                )
              }
              className="absolute top-3 right-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedIndex === 1 ? '¡Copiado!' : 'Copiar'}</span>
            </button>
            <p className="text-slate-400"># En la carpeta raíz del proyecto:</p>
            <p>git init</p>
            <p>git add .</p>
            <p>git commit -m "Entrega AsisTrack - TP Final Integrador Programacion III"</p>
            <p>git branch -M main</p>
            <p>git remote add origin https://github.com/TU_USUARIO/asistrack.git</p>
            <p>git push -u origin main</p>
          </div>
        </div>

        {/* Paso 2: Render Blueprint */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-sky-600" />
                Despliegue Automático con <span className="font-mono text-sky-700">render.yaml</span>
              </h3>
              <p className="text-xs text-slate-500">
                Render detecta automáticamente el archivo <code className="bg-slate-100 px-1 rounded">render.yaml</code> incluido en la raíz.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <p>
              1. Ve a tu panel de control en <a href="https://render.com" target="_blank" rel="noreferrer" className="text-sky-600 font-bold underline">Render.com</a> e inicia sesión con GitHub.
            </p>
            <p>
              2. Haz clic en <strong>New +</strong> y selecciona <strong>Blueprint</strong>.
            </p>
            <p>
              3. Selecciona tu repositorio <strong>asistrack</strong>. Render leerá automáticamente la configuración de <span className="font-mono font-bold">render.yaml</span> y provisionará:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1 font-semibold text-slate-700">
              <li>Una base de datos <strong>PostgreSQL</strong> (nombre: <code className="font-mono text-slate-800">asistrack-db</code>).</li>
              <li>Un servicio web Node.js con comandos: <code className="font-mono text-slate-800">npm install && npm run build</code> y <code className="font-mono text-slate-800">npm start</code>.</li>
              <li>La variable <code className="font-mono text-slate-800">DATABASE_URL</code> conectada automáticamente entre ambos.</li>
            </ul>
          </div>
        </div>

        {/* Paso 3: Inicialización de Tablas en PostgreSQL */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                Inicialización de Tablas y Restricciones (<span className="font-mono text-emerald-700">database.sql</span>)
              </h3>
              <p className="text-xs text-slate-500">
                Al iniciar el servidor en Render, el sistema ejecuta automáticamente <span className="font-mono">database.sql</span> si las tablas aún no existen.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            O si deseas ejecutarlo manualmente desde la consola psql de Render o DBeaver/pgAdmin:
          </p>

          <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-200 relative">
            <button
              onClick={() =>
                copyCode(
                  `psql $DATABASE_URL -f database.sql`,
                  2
                )
              }
              className="absolute top-3 right-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedIndex === 2 ? '¡Copiado!' : 'Copiar'}</span>
            </button>
            <p className="text-slate-400"># Cargar tablas en PostgreSQL:</p>
            <p>psql $DATABASE_URL -f database.sql</p>
          </div>
        </div>

        {/* Archivos incluidos para la entrega */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Estructura de Archivos del Trabajo Práctico
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono font-bold text-sky-700 block">database.sql</span>
              <p className="text-slate-500 mt-1">Script DDL con tablas usuarios, cursos, estudiantes, asistencias y restricción UNIQUE.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono font-bold text-sky-700 block">render.yaml</span>
              <p className="text-slate-500 mt-1">Blueprint de Render para desplegar el servicio web y la base de datos PostgreSQL.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono font-bold text-sky-700 block">server.ts</span>
              <p className="text-slate-500 mt-1">Servidor Express de producción que atiende la API REST y sirve el frontend estático.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-mono font-bold text-sky-700 block">server/db.ts</span>
              <p className="text-slate-500 mt-1">Capa de conexión dual a PostgreSQL vía pg.Pool con fallback local persistente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
