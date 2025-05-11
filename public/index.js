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
import supabase from './supabaseClient.js';

app.use(express.json());

app.post('/api/alta-jugador', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre requerido.' });
  }

  // Comprobar si ya existe
  const { data: existe } = await supabase
    .from('jugadores')
    .select('id')
    .eq('nombre', nombre.trim())
    .maybeSingle();

  if (existe) {
    return res.status(400).json({ error: 'El jugador ya existe.' });
  }

  const { error } = await supabase
    .from('jugadores')
    .insert([{ nombre: nombre.trim() }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ ok: true });
});

// Ruta que expone los tiempos mejorados
app.use(tiemposMejorados);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
