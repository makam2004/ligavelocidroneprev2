import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import tiemposMejorados from './routes/tiemposMejorados.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir el contenido de la carpeta public/
app.use(express.static(path.join(__dirname, 'public')));

// Ruta que expone los tiempos mejorados
app.use(tiemposMejorados);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
