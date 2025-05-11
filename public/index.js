import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import tiemposMejorados from './routes/tiemposMejorados.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Resolución de rutas con ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use(tiemposMejorados);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
