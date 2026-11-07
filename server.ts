import path from 'path';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import { initDB } from './server/db.ts';
import { createExpressApp } from './server/app.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  await initDB();

  const app = createExpressApp();

  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log(`Serving static production build from: ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 AsisTrack Servidor activo en http://0.0.0.0:${PORT}`);
    console.log(`📚 Trabajo Práctico Integrador de Programación III`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting AsisTrack server:', err);
  process.exit(1);
});
